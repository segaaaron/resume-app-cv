import FullScreenLoading from "@/components/shared/FullScreenLoading"

/**
 * Loading boundary for every localized route that does not declare a closer
 * one — auth, editor, checkout, pricing, templates, public CV.
 *
 * The (dashboard) tabs keep their own skeletons; the print routes declare an
 * empty boundary so the PDF renderer never sees this overlay.
 */
export default function Loading() {
  return <FullScreenLoading />
}
