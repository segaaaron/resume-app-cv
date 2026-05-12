export interface CandidateData {
  name: string
  jobTitle: string
  email: string
  phone: string
  address: string
  photo: string
  photoPosition?: number
  linkedin: string
  website: string
}

export interface CoverLetterContent {
  recipientName: string
  recipientTitle: string
  company: string
  subject: string
  body: string
  closing: string
  candidateName?: string
  candidateJobTitle?: string
  candidateEmail?: string
  candidatePhone?: string
  candidateAddress?: string
  candidatePhoto?: string
  candidateLinkedin?: string
  candidateWebsite?: string
  candidatePhotoPosition?: number
}

export interface TemplateProps {
  content: CoverLetterContent
  candidate: CandidateData
  colorScheme: string
}
