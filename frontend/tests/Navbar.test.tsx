/**
 * Unit tests for Navbar component
 * Supabase is mocked so no real network calls are made.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

import { createBrowserClient } from '@supabase/ssr';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: mockFrom,
};

(createBrowserClient as jest.Mock).mockReturnValue(mockSupabase);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

function setupAuthenticatedUser(overrides: { is_admin?: boolean; name?: string } = {}) {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-123',
        email: 'alice@umass.edu',
        user_metadata: { full_name: 'Alice Smith' },
      },
    },
  });

  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: {
        name: overrides.name ?? 'Alice Smith',
        email: 'alice@umass.edu',
        is_admin: overrides.is_admin ?? false,
      },
    }),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (usePathname as jest.Mock).mockReturnValue('/classes');
  (createBrowserClient as jest.Mock).mockReturnValue(mockSupabase);
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe('Navbar — unauthenticated', () => {
  it('renders the UNotes brand link', async () => {
    setupUnauthenticated();
    render(<Navbar />);
    expect(screen.getByText('UNotes')).toBeInTheDocument();
  });

  it('shows Sign In button when no user is logged in', async () => {
    setupUnauthenticated();
    render(<Navbar />);
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  it('Sign In link points to /auth/google', async () => {
    setupUnauthenticated();
    render(<Navbar />);
    await waitFor(() => {
      const link = screen.getByText('Sign In').closest('a');
      expect(link).toHaveAttribute('href', '/auth/google');
    });
  });

  it('does not show Post Notes button when logged out', async () => {
    setupUnauthenticated();
    render(<Navbar />);
    await waitFor(() => {
      expect(screen.queryByText('Post Notes')).not.toBeInTheDocument();
    });
  });
});

describe('Navbar — authenticated regular user', () => {
  it('shows Post Notes button', async () => {
    setupAuthenticatedUser();
    render(<Navbar />);
    await waitFor(() => {
      expect(screen.getByText('Post Notes')).toBeInTheDocument();
    });
  });

  it('shows the user display name', async () => {
    setupAuthenticatedUser({ name: 'Alice Smith' });
    render(<Navbar />);
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('does NOT show Admin link for non-admin user', async () => {
    setupAuthenticatedUser({ is_admin: false });
    render(<Navbar />);
    await waitFor(() => {
      // Wait for user to load; admin link should remain absent
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('opens Post modal when Post Notes is clicked', async () => {
    setupAuthenticatedUser();
    render(<Navbar />);
    await waitFor(() => screen.getByText('Post Notes'));
    fireEvent.click(screen.getByText('Post Notes'));
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
  });

  it('closes Post modal when X button is clicked', async () => {
    setupAuthenticatedUser();
    render(<Navbar />);
    await waitFor(() => screen.getByText('Post Notes'));
    fireEvent.click(screen.getByText('Post Notes'));
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText('Create New Post')).not.toBeInTheDocument();
    });
  });
});

describe('Navbar — admin user', () => {
  it('shows Admin link for admin user', async () => {
    setupAuthenticatedUser({ is_admin: true });
    render(<Navbar />);
    await waitFor(() => {
      expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    });
  });
});

describe('Navbar — active route highlighting', () => {
  it('marks My Classes link as active on /classes', async () => {
    (usePathname as jest.Mock).mockReturnValue('/classes');
    setupUnauthenticated();
    render(<Navbar />);
    const link = screen.getByRole('link', { name: /my classes/i });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks Saved Notes link as active on /savednotes', async () => {
    (usePathname as jest.Mock).mockReturnValue('/savednotes');
    setupUnauthenticated();
    render(<Navbar />);
    const link = screen.getByRole('link', { name: /saved notes/i });
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});