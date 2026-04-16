"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "¿Es gratuito CVV Pro?",
    answer: "Puedes comenzar gratis. Para acceso completo a todas las plantillas y descarga en PDF, ofrecemos un plan premium desde $9.99/mes o una prueba de 14 días por $0.99.",
  },
  {
    question: "¿Puedo cambiar de plantilla sin perder mis datos?",
    answer: "Sí. Tus datos están separados de la plantilla. Puedes cambiar entre las 12 plantillas en cualquier momento y tu contenido se adaptará automáticamente.",
  },
  {
    question: "¿En qué formatos puedo descargar mi CV?",
    answer: "Actualmente puedes descargar en PDF de alta resolución, optimizado para impresión y para envío electrónico.",
  },
  {
    question: "¿Puedo crear más de un CV?",
    answer: "Sí. Con el plan premium puedes crear CVs ilimitados, lo que te permite adaptar tu currículum a diferentes puestos o industrias.",
  },
  {
    question: "¿Puedo importar mi CV existente?",
    answer: "Sí. Puedes importar tu CV en formato PDF o Word (.docx) y el sistema extraerá automáticamente tu información para poblar el editor.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Absolutamente. Usamos encriptación de nivel bancario y nunca compartimos tus datos con terceros. Puedes eliminar tu cuenta y todos tus datos en cualquier momento.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Preguntas frecuentes</h2>
        <p className="text-center text-muted-foreground mb-12">
          Todo lo que necesitas saber antes de comenzar
        </p>

        <Accordion className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-xl px-4 shadow-sm"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
