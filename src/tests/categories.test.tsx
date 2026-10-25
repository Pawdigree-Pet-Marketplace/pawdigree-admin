import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi } from '../services/adminApi'
import { ApiError } from '../services/api'
import { CategoriesManagement } from '../pages/CategoriesManagement'

vi.mock('../services/adminApi', () => ({ adminApi: {
  getCategories: vi.fn(), createCategory: vi.fn(), updateCategory: vi.fn(), deactivateCategory: vi.fn(),
} }))

const categories = [
  { id: 1, name: 'Grooming', description: 'Baths and trims', is_active: true },
  { id: 2, name: 'Boarding', description: 'Overnight stays', active: false },
]

describe('CategoriesManagement', () => {
  beforeEach(() => {
    vi.mocked(adminApi.getCategories).mockResolvedValue([...categories])
    vi.mocked(adminApi.createCategory).mockResolvedValue({ id: 3, name: 'New' })
    vi.mocked(adminApi.updateCategory).mockResolvedValue({ id: 1, name: 'Updated' })
    vi.mocked(adminApi.deactivateCategory).mockResolvedValue(undefined)
  })

  it('shows loading then categories, filters, and renders empty results', async () => {
    let resolve!: (value: typeof categories) => void
    vi.mocked(adminApi.getCategories).mockReturnValueOnce(new Promise((done) => { resolve = done }))
    render(<CategoriesManagement />)
    expect(screen.getByText('Loading categories…')).toBeInTheDocument()
    resolve([...categories])
    expect(await screen.findByText('Grooming')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Search categories' }), 'unknown')
    expect(screen.getByText('No matching categories')).toBeInTheDocument()
  })

  it('creates a category with trimmed fields then reloads', async () => {
    const user = userEvent.setup()
    render(<CategoriesManagement />)
    await screen.findByText('Grooming')
    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.type(screen.getByLabelText('Category name'), '  Training  ')
    await user.type(screen.getByLabelText(/Description/), '  Classes  ')
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    await waitFor(() => expect(adminApi.createCategory).toHaveBeenCalledWith({ name: 'Training', description: 'Classes' }))
    expect(adminApi.getCategories).toHaveBeenCalledTimes(2)
  })

  it('edits a category and deactivates only after confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CategoriesManagement />)
    await screen.findByText('Grooming')
    await user.click(screen.getByRole('button', { name: 'Edit Grooming' }))
    const name = screen.getByLabelText('Category name')
    await user.clear(name)
    await user.type(name, 'Pet spa')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(adminApi.updateCategory).toHaveBeenCalledWith(1, { name: 'Pet spa', description: 'Baths and trims' }))
    await user.click(await screen.findByRole('button', { name: 'Deactivate Grooming' }))
    await waitFor(() => expect(adminApi.deactivateCategory).toHaveBeenCalledWith(1))
  })

  it('shows server errors and an empty state', async () => {
    vi.mocked(adminApi.getCategories).mockRejectedValueOnce(new ApiError('Could not load categories', 500))
    render(<CategoriesManagement />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load categories')
    expect(screen.getByText('No categories yet')).toBeInTheDocument()
  })
})

