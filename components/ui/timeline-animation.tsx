"use client"

import { useInView } from "framer-motion"
import { motion } from "framer-motion"
import { useRef } from "react"

type AnimEl = "div" | "p" | "span" | "section" | "article"

interface TimelineContentProps {
  as?: AnimEl
  animationNum?: number
  timelineRef?: React.RefObject<HTMLElement | null>
  customVariants?: {
    visible: (i: number) => object
    hidden: object
  }
  className?: string
  children: React.ReactNode
}

export function TimelineContent({
  animationNum = 0,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  const variants = customVariants ?? {
    hidden: { y: -20, opacity: 0, filter: "blur(10px)" },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.15, duration: 0.45 },
    }),
  }

  return (
    <motion.div
      ref={ref}
      custom={animationNum}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
