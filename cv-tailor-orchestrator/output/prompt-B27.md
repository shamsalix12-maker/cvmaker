# BLOCK B27: Multi-AI Draft Panel

## COMPLETED BLOCKS
- B01 ✅: Create Empty Next.js Project — Files: [F001], [F002], [F003], [F004], [F005], [F006], [F007], [F008], [F009]
- B02 ✅: Install All Dependencies — Files: [F027], [F028], [F029], [F030], [F031], [F032], [F033], [F034], [F035], [F036], [F090], [F091]
- B03 ✅: Central TypeScript Types — Files: [F079]
- B04 ✅: Constants and Utilities — Files: [F078], [F080]
- B05 ✅: Internationalization (i18n) System — Files: [F086], [F087], [F088], [F089]
- B06 ✅: Supabase Connection and Database Setup — Files: [F063], [F064], [F065], [F093], [F094]
- B07 ✅: Development Auth (Temporary Login) — Files: [F089], [F090], [F091], [F092]
- B08 ✅: Main Layout (Header + Sidebar + Footer) — Files: [F037], [F038], [F039], [F040], [F093], [F094], [F012]
- B09 ✅: File Parsers (Word + Markdown) — Files: [F072], [F073], [F095]
- B10 ✅: AI Provider Interface (Abstract Layer) — Files: [F066], [F067], [F068], [F069], [F070], [F104]
- B11 ✅: API Key Encryption and Storage — Files: [F077], [F105], [F106], [F081]
- B12 ✅: AI-Powered CV Field Extraction — Files: [F074], [F107], [F108], [F109], [F110]
- B17 ✅: Prompt Management System — Files: [F024], [F118], [F119], [F120], [F121], [F083], [F045], [F046], [F047], [F048], [F122], [F123], [F015], [F124]
- B19 ✅: Export System (Word & Markdown) — Files: [F075], [F076], [F142], [F143], [F025], [F026], [F144]
- B20 ✅: Template Management System — Files: [F145], [F146], [F147], [F148], [F149], [F150], [F060], [F061], [F062], [F151], [F152]
- B23 ✅: Settings Page — Files: [F049], [F165], [F166], [F167], [F168]
- B25 ✅: DOCX File Generator — Files: [F075], [F142], [F143], [F025], [F144]
- B26 ✅: Markdown File Generator — Files: [F076], [F026]

## GOAL
Create a panel to manage multiple AI drafts.
Features:
- Select multiple AI models for drafting
- Display each draft outcome separately
- Select the final AI model for consolidation
- Combine drafts and send to the final model


## FILES TO CREATE
[F053] src/components/ai/AIMultiDraftPanel.tsx

## FILES TO MODIFY
None

## EXISTING FILES YOU MAY IMPORT FROM
[F001] package.json (from B01)
[F002] tsconfig.json (from B01)
[F003] next.config.ts (from B01)
[F004] tailwind.config.ts (from B01)
[F005] .env.local (from B01)
[F006] .env.example (from B01)
[F007] src/app/layout.tsx (from B01)
[F008] src/app/page.tsx (from B01)
[F009] src/app/globals.css (from B01)
[F027] src/components/ui/button.tsx (from B02)
[F028] src/components/ui/input.tsx (from B02)
[F029] src/components/ui/card.tsx (from B02)
[F030] src/components/ui/dialog.tsx (from B02)
[F031] src/components/ui/select.tsx (from B02)
[F032] src/components/ui/textarea.tsx (from B02)
[F033] src/components/ui/tabs.tsx (from B02)
[F034] src/components/ui/badge.tsx (from B02)
[F035] src/components/ui/sonner.tsx (from B02)
[F036] src/components/ui/dropdown-menu.tsx (from B02)
[F090] src/context/AuthContext.tsx (from B07)
[F091] src/components/auth/DevLoginForm.tsx (from B07)
[F079] src/lib/types.ts (from B03)
[F078] src/lib/constants.ts (from B04)
[F080] src/lib/helpers.ts (from B04)
[F086] src/i18n/config.ts (from B05)
[F087] src/i18n/en.json (from B05)
[F088] src/i18n/fa.json (from B05)
[F089] src/lib/auth/dev-auth.ts (from B07)
[F063] src/lib/supabase/client.ts (from B06)
[F064] src/lib/supabase/server.ts (from B06)
[F065] src/lib/supabase/middleware.ts (from B06)
[F093] src/components/layout/MainLayout.tsx (from B08)
[F094] src/components/layout/MobileMenu.tsx (from B08)
[F092] src/components/auth/AuthGuard.tsx (from B07)
[F037] src/components/layout/Header.tsx (from B08)
[F038] src/components/layout/Sidebar.tsx (from B08)
[F039] src/components/layout/Footer.tsx (from B08)
[F040] src/components/layout/LanguageSwitcher.tsx (from B08)
[F012] src/app/[locale]/dashboard/page.tsx (from B08)
[F072] src/lib/parsers/docx-parser.ts (from B09)
[F073] src/lib/parsers/markdown-parser.ts (from B09)
[F095] src/lib/parsers/index.ts (from B09)
[F066] src/lib/ai/ai-provider.ts (from B10)
[F067] src/lib/ai/openai-provider.ts (from B10)
[F068] src/lib/ai/anthropic-provider.ts (from B10)
[F069] src/lib/ai/google-ai-provider.ts (from B10)
[F070] src/lib/ai/ai-factory.ts (from B10)
[F104] src/lib/ai/index.ts (from B10)
[F077] src/lib/encryption.ts (from B11)
[F105] src/app/api/ai/keys/route.ts (from B11)
[F106] src/app/api/ai/validate/route.ts (from B11)
[F081] src/hooks/useAIKeys.ts (from B11)
[F074] src/lib/cv/cv-extractor.ts (from B12)
[F107] src/lib/cv/cv-extraction-prompt.ts (from B12)
[F108] src/lib/cv/cv-validator.ts (from B12)
[F109] src/lib/cv/index.ts (from B12)
[F110] src/app/api/cv/extract/route.ts (from B12)
[F024] src/app/api/prompts/route.ts (from B17)
[F118] src/app/api/prompts/[id]/route.ts (from B17)
[F119] src/lib/prompts/prompt-service.ts (from B17)
[F120] src/lib/prompts/index.ts (from B17)
[F121] src/lib/prompts/default-prompts.ts (from B17)
[F083] src/hooks/usePrompts.ts (from B17)
[F045] src/components/prompts/PromptList.tsx (from B17)
[F046] src/components/prompts/PromptEditor.tsx (from B17)
[F047] src/components/prompts/PromptSelector.tsx (from B17)
[F048] src/components/prompts/PromptCategoryFilter.tsx (from B17)
[F122] src/components/prompts/PromptCard.tsx (from B17)
[F123] src/components/prompts/PromptPreview.tsx (from B17)
[F015] src/app/[locale]/prompts/page.tsx (from B17)
[F124] src/app/[locale]/prompts/loading.tsx (from B17)
[F075] src/lib/generators/docx-generator.ts (from B25)
[F076] src/lib/generators/markdown-generator.ts (from B26)
[F142] src/lib/generators/docx-styles.ts (from B25)
[F143] src/lib/generators/docx-templates.ts (from B25)
[F025] src/app/api/export/docx/route.ts (from B25)
[F026] src/app/api/export/markdown/route.ts (from B26)
[F144] src/lib/generators/index.ts (from B25)
[F145] src/lib/templates/template-service.ts (from B20)
[F146] src/lib/templates/template-parser.ts (from B20)
[F147] src/lib/templates/index.ts (from B20)
[F148] src/app/api/templates/route.ts (from B20)
[F149] src/app/api/templates/[id]/route.ts (from B20)
[F150] src/hooks/useTemplates.ts (from B20)
[F060] src/components/templates/TemplateUploader.tsx (from B20)
[F061] src/components/templates/TemplateSelector.tsx (from B20)
[F062] src/components/templates/TemplatePreview.tsx (from B20)
[F151] src/components/templates/TemplateList.tsx (from B20)
[F152] src/components/templates/TemplateCard.tsx (from B20)
[F049] src/components/ai/AIKeyManager.tsx (from B23)
[F165] src/components/settings/SettingsNav.tsx (from B23)
[F166] src/components/settings/ProfileSettings.tsx (from B23)
[F167] src/components/settings/LanguageSettings.tsx (from B23)
[F168] src/components/settings/TemplateSettings.tsx (from B23)

## FILES YOU MUST NOT TOUCH
Everything not listed above.

## CHECKPOINT TESTS (verify ALL after completion)
□ [T01] Select multiple AIs for Draft
□ [T02] Each Draft is displayed separately
□ [T03] Select Final AI
□ [T04] Combine drafts and send to Final

## MANDATORY RULES
1. Create ONLY the files listed in "FILES TO CREATE"
2. Modify ONLY the files listed in "FILES TO MODIFY"
3. NEVER import from files not in "EXISTING FILES"
4. NEVER reference files that don't exist
5. After completion, list every file you created/modified with full path
6. Mark each checkpoint test as ✅ PASS or ❌ FAIL
7. If unsure about anything, ASK — don't guess
8. Keep each file under 200 lines
9. All user-facing text must use i18n (if i18n is set up)
10. Handle errors gracefully
