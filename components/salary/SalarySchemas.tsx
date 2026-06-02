type Json = Record<string, unknown> | Array<Record<string, unknown>>

export default function SalarySchemas({ schemas }: { schemas: Json[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
