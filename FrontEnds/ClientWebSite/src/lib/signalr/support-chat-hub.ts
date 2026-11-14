import * as signalR from '@microsoft/signalr';

import type {
  SupportChatConversationDeletedPayload,
  SupportChatConversationUpdatedPayload,
  SupportChatMessageDeletedPayload,
  SupportChatMessagePostedPayload,
  SupportChatMessageUpdatedPayload,
  SupportChatMessagesDeliveredPayload,
  SupportChatMessagesReadPayload,
} from '@/lib/api/support-chat';

import { getBackendApiOrigin } from '@/lib/api/config';

import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';



const HUB_PATH = '/hubs/support-chat';



export type SupportChatHubEvent =
  | 'MessagePosted'
  | 'MessageUpdated'
  | 'MessageDeleted'
  | 'ConversationOpened'
  | 'ConversationUpdated'
  | 'ConversationDeleted'
  | 'ConversationStatusChanged'
  | 'MessagesDelivered'
  | 'MessagesRead'
  | 'NotificationPulse'
  | 'UserPresenceChanged';

export type MessagePostedPayload = SupportChatMessagePostedPayload;
export type MessageUpdatedPayload = SupportChatMessageUpdatedPayload;
export type MessageDeletedPayload = SupportChatMessageDeletedPayload;
export type ConversationUpdatedPayload = SupportChatConversationUpdatedPayload;
export type ConversationDeletedPayload = SupportChatConversationDeletedPayload;
export type MessagesDeliveredPayload = SupportChatMessagesDeliveredPayload;
export type MessagesReadPayload = SupportChatMessagesReadPayload;



export interface ConversationOpenedPayload {

  conversationId: number;

  studentUserId: number;

  teacherUserId: number;

  subject: string;

  studentName: string;

  initialMessagePreview?: string | null;

}



export interface ConversationStatusChangedPayload {

  conversationId: number;

  status: string;

  studentUserId: number;

  teacherUserId: number;

}

export interface UserPresenceChangedPayload {
  userId: number;
  isOnline: boolean;
}



type EventHandler = (...args: unknown[]) => void;



export function getSupportChatHubUrl(): string {

  return resolveHubUrl(HUB_PATH, {

    directEnvKey: 'NEXT_PUBLIC_SUPPORT_CHAT_HUB_DIRECT',

    proxyEnvKey: 'NEXT_PUBLIC_SUPPORT_CHAT_HUB_PROXY',

  });

}



class SupportChatHubClient {

  private connection: signalR.HubConnection | null = null;

  private startPromise: Promise<void> | null = null;

  private refCount = 0;

  private handlers = new Map<SupportChatHubEvent, Set<EventHandler>>();



  private buildConnection(hubUrl: string): signalR.HubConnection {

    const connection = new signalR.HubConnectionBuilder()

      .withUrl(hubUrl, {

        withCredentials: true,

        ...(isProxiedHubUrl(hubUrl) ? { transport: signalR.HttpTransportType.LongPolling } : {}),

      })

      .withAutomaticReconnect()

      .configureLogging(HUB_CONNECTION_LOG_LEVEL)

      .build();



    (

      [
        'MessagePosted',
        'MessageUpdated',
        'MessageDeleted',
        'ConversationOpened',
        'ConversationUpdated',
        'ConversationDeleted',
        'ConversationStatusChanged',
        'MessagesDelivered',
        'MessagesRead',
        'NotificationPulse',
        'UserPresenceChanged',
      ] as SupportChatHubEvent[]

    ).forEach((event) => {

      connection.on(event, (...args: unknown[]) => {

        this.handlers.get(event)?.forEach((handler) => handler(...args));

      });

    });



    return connection;

  }



  private ensureConnection(): signalR.HubConnection {

    if (!this.connection) this.connection = this.buildConnection(getSupportChatHubUrl());

    return this.connection;

  }



  private async startWithFallback(): Promise<void> {
    const primaryUrl = getSupportChatHubUrl();
    const fallbackUrl = `${getBackendApiOrigin()}${HUB_PATH}`;

    await connectHubWithFallback({
      connection: this.connection,
      setConnection: (connection) => {
        this.connection = connection;
      },
      buildConnection: (hubUrl) => this.buildConnection(hubUrl),
      primaryUrl,
      fallbackUrl,
    });
  }

  private async start(): Promise<signalR.HubConnection | null> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (!this.startPromise) {
      this.startPromise = this.startWithFallback().finally(() => {
        this.startPromise = null;
      });
    }

    await this.startPromise;

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    return null;
  }

  async acquire(): Promise<signalR.HubConnection | null> {
    this.refCount += 1;
    const connection = await this.start();
    if (!connection) {
      this.refCount = Math.max(0, this.refCount - 1);
    }
    return connection;
  }

  release(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    scheduleDeferredHubDisconnect(
      () => this.refCount,
      () => this.connection,
      (connection) => {
        this.connection = connection;
      }
    );
  }



  async leaveGroups(options: { conversationId?: number; userId?: number; watchPresenceUserId?: number }): Promise<void> {

    const connection = this.connection;

    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {

      return;

    }

    try {

      if (options.conversationId && options.conversationId > 0) {

        await connection.invoke('LeaveConversation', options.conversationId);

      }

      if (options.userId && options.userId > 0) {

        await connection.invoke('LeaveUser', options.userId);

      }

      if (options.watchPresenceUserId && options.watchPresenceUserId > 0) {

        await connection.invoke('UnwatchUserPresence', options.watchPresenceUserId);

      }

    } catch {

      /* Hub methods may be unavailable until the API is redeployed */

    }

  }



  on(event: SupportChatHubEvent, handler: EventHandler): void {

    if (!this.handlers.has(event)) this.handlers.set(event, new Set());

    this.handlers.get(event)!.add(handler);

  }



  off(event: SupportChatHubEvent, handler: EventHandler): void {

    this.handlers.get(event)?.delete(handler);

  }

}



export const supportChatHubClient = new SupportChatHubClient();

