-- One-time cleanup: room seats were created with IsOnline = 1 before login.
-- Run on production if students still see "already active" after API deploy (deploy also clears on login).
UPDATE [Room].[RoomUsers]
SET [IsOnline] = 0
WHERE [IsDelete] = 0 AND [IsOnline] = 1;
