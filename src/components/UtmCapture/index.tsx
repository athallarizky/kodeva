'use client'

import React, { useEffect } from 'react'

import { captureFromLocation } from '@/lib/utm'

/**
 * Menangkap UTM dari URL sekali per mount (api-contract §5 — last-touch).
 * Dipasang di layout publik; tidak merender apa pun.
 */
export const UtmCapture: React.FC = () => {
  useEffect(() => {
    captureFromLocation()
  }, [])
  return null
}
