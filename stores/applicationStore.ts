import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export type AppStatus = "WISHLIST" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED"

export interface ApplicationCard {
  id: string
  jobTitle: string
  company: string
  status: AppStatus
  modalidad?: string
  notes?: string
  url?: string
  salary?: string
  appliedAt?: string
  followUpAt?: string | null
  createdAt: string
}

interface ApplicationState {
  applications: ApplicationCard[]
  isLoading: boolean
}

interface ApplicationActions {
  setApplications: (apps: ApplicationCard[]) => void
  addApplication: (app: ApplicationCard) => void
  updateApplication: (id: string, data: Partial<ApplicationCard>) => void
  moveApplication: (id: string, status: AppStatus) => void
  deleteApplication: (id: string) => void
  clearApplications: () => void
}

export const useApplicationStore = create<ApplicationState & ApplicationActions>()(
  immer((set) => ({
    applications: [],
    isLoading: false,

    setApplications: (apps) => set((state) => { state.applications = apps }),

    addApplication: (app) => set((state) => { state.applications.push(app) }),

    updateApplication: (id, data) => set((state) => {
      const idx = state.applications.findIndex((a) => a.id === id)
      if (idx !== -1) Object.assign(state.applications[idx], data)
    }),

    moveApplication: (id, status) => set((state) => {
      const app = state.applications.find((a) => a.id === id)
      if (app) app.status = status
    }),

    deleteApplication: (id) => set((state) => {
      state.applications = state.applications.filter((a) => a.id !== id)
    }),

    clearApplications: () => set((state) => { state.applications = [] }),
  }))
)
