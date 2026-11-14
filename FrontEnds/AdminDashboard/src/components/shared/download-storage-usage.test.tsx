import { act, render, screen } from '@testing-library/react';
import { DownloadStorageUsage } from './download-storage-usage';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/components/auth-provider';

jest.mock('@/components/auth-provider', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/language-provider', () => ({ useLanguage: () => ({ locale: 'en' }) }));
jest.mock('@/lib/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('lucide-react', () => ({ HardDrive: () => null, RefreshCw: () => null }));

describe('download-host usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ authUser: { roleName: 'admin' } });
  });

  it('shows host usage above upload controls and refreshes after files change', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {
      capacityBytes: 50 * 1024 ** 3, usedBytes: 12 * 1024 ** 3, remainingBytes: 38 * 1024 ** 3,
    } });
    const { rerender } = render(<DownloadStorageUsage refreshKey={1} />);
    await act(async () => {});
    expect(screen.getByText('50 GiB')).toBeInTheDocument();
    expect(screen.getByText('12 GiB')).toBeInTheDocument();
    expect(screen.getByText('38 GiB')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '24');
    rerender(<DownloadStorageUsage refreshKey={2} />);
    await act(async () => {});
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('does not show capacity or request host information for teachers', async () => {
    (useAuth as jest.Mock).mockReturnValue({ authUser: { roleName: 'teacher' } });
    const { container } = render(<DownloadStorageUsage />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('shows an error instead of inventing free space when the host cannot be measured', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Storage unavailable'));
    render(<DownloadStorageUsage />);
    await act(async () => {});
    expect(screen.getByRole('alert')).toHaveTextContent('Storage usage is unavailable');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
