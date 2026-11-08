import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi } from '../services/adminApi'
import { ApiError } from '../services/api'
import { ListingApprovalQueue } from '../pages/ListingApprovalQueue'

vi.mock('../services/adminApi', () => ({ adminApi: {
  getPendingPets: vi.fn(), approvePet: vi.fn(), rejectPet: vi.fn(),
} }))

const pets = [
  { id: 11, name: 'Milo', breed: 'Beagle', owner: { full_name: 'Amina N.' }, created_at: '2026-10-25' },
  { id: 12, pet_name: 'Luna', species: 'Cat', owner_name: 'Brian' },
]

describe('ListingApprovalQueue', () => {
  beforeEach(() => {
    vi.mocked(adminApi.getPendingPets).mockResolvedValue([...pets])
    vi.mocked(adminApi.approvePet).mockResolvedValue({ ok: true })
    vi.mocked(adminApi.rejectPet).mockResolvedValue({ ok: true })
  })

  it('loads listings and filters by pet and owner; handles an empty queue', async () => {
    let resolve!: (value: typeof pets) => void
    vi.mocked(adminApi.getPendingPets).mockReturnValueOnce(new Promise((done) => { resolve = done }))
    const user = userEvent.setup()
    render(<ListingApprovalQueue />)
    expect(screen.getByText('Loading pending listings…')).toBeInTheDocument()
    resolve([...pets])
    expect(await screen.findByText('Milo')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search pending listings' }), 'brian')
    expect(screen.getByText('Luna')).toBeInTheDocument()
    expect(screen.queryByText('Milo')).not.toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: 'Search pending listings' }))
    await user.click(within(screen.getByRole('row', { name: /Milo/ })).getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(adminApi.approvePet).toHaveBeenCalledWith(11))
    expect(screen.queryByText('Milo')).not.toBeInTheDocument()
  })

  it('requires a nonblank rejection reason and submits the trimmed reason', async () => {
    const user = userEvent.setup()
    render(<ListingApprovalQueue />)
    await screen.findByText('Milo')
    await user.click(screen.getAllByRole('button', { name: 'Reject' })[0])
    const submit = screen.getByRole('button', { name: 'Reject listing' })
    expect(submit).toBeDisabled()
    const field = screen.getByLabelText('Reason for rejection')
    await user.type(field, '   ')
    expect(submit).toBeDisabled()
    await user.clear(field)
    await user.type(field, '  Missing records  ')
    expect(submit).toBeEnabled()
    await user.click(submit)
    await waitFor(() => expect(adminApi.rejectPet).toHaveBeenCalledWith(11, 'Missing records'))
    expect(screen.queryByText('Milo')).not.toBeInTheDocument()
  })

  it('shows API errors and a clear-queue empty state', async () => {
    vi.mocked(adminApi.getPendingPets).mockRejectedValueOnce(new ApiError('Queue unavailable', 503))
    const { unmount } = render(<ListingApprovalQueue />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Queue unavailable')
    unmount()
    vi.mocked(adminApi.getPendingPets).mockResolvedValueOnce([])
    render(<ListingApprovalQueue />)
    expect(await screen.findByText('Queue is clear')).toBeInTheDocument()
  })
})


