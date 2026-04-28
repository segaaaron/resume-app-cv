export interface CandidateData {
  name: string
  jobTitle: string
  email: string
  phone: string
  address: string
  photo: string
  linkedin: string
  website: string
}

export interface CoverLetterContent {
  recipientName: string
  recipientTitle: string
  company: string
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
}

export interface TemplateProps {
  content: CoverLetterContent
  candidate: CandidateData
  colorScheme: string
}
