import { describe, it, expect } from 'bun:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Input, InputWrapper } from '@/components/ui/input'
import { User, Mail, Phone, Calendar, Key, Eye } from 'lucide-react'

describe('PreOne UI Bug — Input Icon and Text Clearance Test Suite', () => {
  describe('1. Shared Input Component Architecture & Layout', () => {
    it('prefilled Name text starts after the leading icon with reserved 44px padding', () => {
      const html = renderToString(
        <Input
          leadingIcon={<User className="w-4 h-4" data-testid="user-icon" />}
          type="text"
          name="fullName"
          value="Priya Sharma"
          onChange={() => {}}
        />
      )

      // Outer wrapper has relative layout and input-wrapper--leading modifier
      expect(html).toContain('input-wrapper')
      expect(html).toContain('input-wrapper--leading')

      // Leading icon container is independently positioned at 14px and has pointer-events-none
      expect(html).toContain('input-wrapper__icon')
      expect(html).toContain('pointer-events-none')
      expect(html).toContain('left-[14px]')
      expect(html).toContain('user-icon')

      // Input field has data-leading-icon="true" and reserved 44px left padding
      expect(html).toContain('data-leading-icon="true"')
      expect(html).toContain('pl-[44px]')
      expect(html).toContain('!pl-[44px]')
      expect(html).toContain('value="Priya Sharma"')
    })

    it('prefilled Email text starts after the leading icon with reserved 44px padding', () => {
      const html = renderToString(
        <Input
          leadingIcon={<Mail className="w-4 h-4" data-testid="mail-icon" />}
          type="email"
          name="email"
          value="priya@preschool.com"
          onChange={() => {}}
        />
      )

      expect(html).toContain('input-wrapper--leading')
      expect(html).toContain('pointer-events-none')
      expect(html).toContain('left-[14px]')
      expect(html).toContain('mail-icon')
      expect(html).toContain('data-leading-icon="true"')
      expect(html).toContain('!pl-[44px]')
      expect(html).toContain('value="priya@preschool.com"')
    })

    it('prefilled Mobile Phone text starts after the leading icon with reserved 44px padding', () => {
      const html = renderToString(
        <Input
          leadingIcon={<Phone className="w-4 h-4" data-testid="phone-icon" />}
          type="tel"
          name="phone"
          value="+91 98765 43210"
          onChange={() => {}}
        />
      )

      expect(html).toContain('input-wrapper--leading')
      expect(html).toContain('pointer-events-none')
      expect(html).toContain('left-[14px]')
      expect(html).toContain('phone-icon')
      expect(html).toContain('data-leading-icon="true"')
      expect(html).toContain('!pl-[44px]')
      expect(html).toContain('value="+91 98765 43210"')
    })

    it('leading icon has pointer-events-none and does not block clicks, caret placement or selection', () => {
      const html = renderToString(
        <Input
          leadingIcon={<User className="w-4 h-4" />}
          placeholder="Enter name"
        />
      )

      // The icon wrapper MUST have pointer-events-none so click events pass through to input
      expect(html).toContain('pointer-events-none')
      // The input element itself MUST NOT have the disabled attribute
      expect(html).not.toContain(' disabled=')
      expect(html).not.toContain(' disabled ')
      expect(html).toContain('placeholder="Enter name"')
    })

    it('inputs without icons retain normal 14px padding and do not apply leading modifier', () => {
      const html = renderToString(
        <Input
          type="text"
          placeholder="No icon input"
          value="Standard text"
          onChange={() => {}}
        />
      )

      // Does not render outer wrapper or leading icon modifier
      expect(html).not.toContain('input-wrapper--leading')
      expect(html).not.toContain('input-wrapper__icon')
      expect(html).not.toContain('!pl-[44px]')
      expect(html).toContain('pl-3.5')
      expect(html).toContain('pr-3.5')
    })

    it('trailing controls reserve 44px right padding so text does not run underneath', () => {
      const html = renderToString(
        <Input
          type="password"
          value="SecretPassword123"
          onChange={() => {}}
          trailingAction={
            <button type="button" aria-label="Toggle password">
              <Eye className="w-4 h-4" />
            </button>
          }
        />
      )

      expect(html).toContain('input-wrapper')
      expect(html).toContain('input-wrapper--trailing')
      expect(html).toContain('input-wrapper__trailing')
      expect(html).toContain('right-[14px]')
      expect(html).toContain('data-trailing-action="true"')
      expect(html).toContain('!pr-[44px]')
      expect(html).toContain('aria-label="Toggle password"')
    })

    it('inputs with both leading icon and trailing action reserve both left and right padding', () => {
      const html = renderToString(
        <Input
          leadingIcon={<Key className="w-4 h-4" />}
          trailingAction={<button type="button">Action</button>}
          type="password"
          value="FullCredentials"
          onChange={() => {}}
        />
      )

      expect(html).toContain('input-wrapper--leading')
      expect(html).toContain('input-wrapper--trailing')
      expect(html).toContain('!pl-[44px]')
      expect(html).toContain('!pr-[44px]')
      expect(html).toContain('data-leading-icon="true"')
      expect(html).toContain('data-trailing-action="true"')
    })

    it('validates error states apply destructive border and focus ring tokens', () => {
      const html = renderToString(
        <Input
          leadingIcon={<Mail className="w-4 h-4" />}
          hasError={true}
          value="invalid-email"
          onChange={() => {}}
        />
      )

      expect(html).toContain('border-destructive')
      expect(html).toContain('focus-visible:!border-destructive')
    })
  })

  describe('2. Global CSS Clearance & Autofill Protection Architecture', () => {
    it('verifies globals.css defines .input-wrapper and icon clearance rules', async () => {
      const css = await Bun.file('src/app/globals.css').text()

      // 1. Structure
      expect(css).toContain('.input-wrapper')
      expect(css).toContain('.input-wrapper__icon')
      expect(css).toContain('.input-wrapper__field')
      expect(css).toContain('.input-wrapper--leading')
      expect(css).toContain('.input-wrapper--trailing')

      // 2. Icon positioning: 14px left, vertically centered, pointer-events: none, width: 18px
      expect(css).toContain('position: absolute;')
      expect(css).toContain('left: 14px;')
      expect(css).toContain('top: 50%;')
      expect(css).toContain('transform: translateY(-50%);')
      expect(css).toContain('width: 18px;')
      expect(css).toContain('height: 18px;')
      expect(css).toContain('pointer-events: none;')

      // 3. Reserved 44px left padding for leading icons
      expect(css).toContain('padding-left: 44px !important;')

      // 4. Reserved 44px right padding for trailing controls
      expect(css).toContain('padding-right: 44px !important;')

      // 5. Browser autofill protection: prevents WebKit autofill from stripping left padding
      expect(css).toContain('.input-wrapper--leading input:-webkit-autofill')
      expect(css).toContain('padding-left: 44px !important;')
    })
  })

  describe('3. Personal Details Form Integration in AddStaffModal', () => {
    it('verifies AddStaffModal uses shared Input component for Personal Details fields', async () => {
      const modalFile = await Bun.file('src/components/users/AddStaffModal.tsx').text()

      // Imports shared Input
      expect(modalFile).toContain("import { Input } from '@/components/ui/input'")

      // Full Name uses Input with leading User icon
      expect(modalFile).toContain('leadingIcon={<User className="w-4 h-4" />}')
      expect(modalFile).toContain('value={fullName}')

      // Work Email uses Input with leading Mail icon
      expect(modalFile).toContain('leadingIcon={<Mail className="w-4 h-4" />}')
      expect(modalFile).toContain('value={email}')

      // Mobile Phone uses Input with leading Phone icon
      expect(modalFile).toContain('leadingIcon={<Phone className="w-4 h-4" />}')
      expect(modalFile).toContain('value={phone}')

      // Date of Birth uses Input with leading Calendar icon
      expect(modalFile).toContain('leadingIcon={<Calendar className="w-4 h-4" />}')
      expect(modalFile).toContain('value={dateOfBirth}')

      // Initial Password uses Input with leading Key icon and trailing Eye toggle
      expect(modalFile).toContain('leadingIcon={<Key className="w-4 h-4" />}')
      expect(modalFile).toContain('trailingAction=')
      expect(modalFile).toContain('value={password}')
    })
  })

  describe('4. AddFamilyModal Form Integration', () => {
    it('verifies AddFamilyModal uses shared Input component for Family fields', async () => {
      const familyModal = await Bun.file('src/components/users/AddFamilyModal.tsx').text()

      // Imports shared Input
      expect(familyModal).toContain("import { Input } from '@/components/ui/input'")

      // Full Name, Mobile Phone, and Email use Input with leading icons
      expect(familyModal).toContain('leadingIcon={<User className="w-4 h-4" />}')
      expect(familyModal).toContain('leadingIcon={<Phone className="w-4 h-4" />}')
      expect(familyModal).toContain('leadingIcon={<Mail className="w-4 h-4" />}')
    })
  })
})
