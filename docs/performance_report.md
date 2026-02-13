# گزارش عملکرد ماژول CV Manager
# Performance Report: CV Manager Module

این گزارش شامل تحلیل فنی فرآیند استخراج، شناسایی گپ‌ها (Gaps) و مدیریت اصلاح رزومه است.

---

## معماری استخراج (Technical Deep-Dive: Extraction)

فرآیند استخراج در `src/lib/cv/multi-stage-extractor.ts` مدیریت می‌شود. جزییات خط‌به‌خط به شرح زیر است:

### ۱. جلوگیری از Truncation و خرابی JSON
- **Multi-Stage Processing (Lines 50-75)**: به جای یک درخواست سنگین، استخراج در ۴ مرحله (`personal_info`, `work_experience`, `education_skills`, `gap_analysis`) انجام می‌شود. این کار باعث می‌شود Token Limit خروجی شکسته نشود.
- **JSON Repair System (Lines 362-480)**: 
    - ابتدا تگ‌های Markdown حذف می‌شوند.
    - در صورت نیمه‌کاره ماندن پاسخ AI، سیستم با شمارش براکت‌ها `{}` و کروشه‌ها `[]` تلاش می‌کند ساختار JSON را ببندد.
    - اگر باز هم پارس نشد، با Regex مقادیر کلیدی مانند ایمیل و نام را استخراج می‌کند (Partial Extraction).

### ۲. اعتبارسنجی و Scoring (Technical Deep-Dive: Validation)

در `src/lib/cv/cv-validator.ts` منطق امتیازدهی دقیقی وجود دارد:
- **Base Completion (Lines 25-82)**: فیلدهای `full_name`, `email` و `summary` اجباری هستند. هر بخش وجود داشته باشد امتیاز مثبت می‌گیرد.
- **Scoring Logic (Lines 220-439)**:
    - **Summary**: اگر زیر ۱۰ کلمه باشد امتیاز کمی می‌گیرد. وجود کلمات عملیاتی (Action Verbs) مانند "Led", "Built" امتیاز را بالا می‌برد.
    - **Work Experience**: برای هر سابقه، وجود "Job Title", "Company" و "Dates" الزامی است. عدم وجود اعداد (Metrics) در "Achievements" به عنوان یک نقص (Issue) ثبت می‌شود.
    - **Skills**: تکراری بودن مهارت‌ها یا استفاده از کلمات خیلی عمومی امتیاز را کاهش می‌دهد.

### ۳. مدیریت امن داده‌ها (Technical Deep-Dive: Safe Merge)

یکی از بخش‌های حیاتی `safeRefineCV` (Lines 647-805 در `multi-stage-extractor.ts`) است:
- **No-Override Principle**: داده‌های موجود هرگز رونویسی (Overwrite) نمی‌شوند مگر اینکه فیلد فعلی خالی باشد.
- **Safe Work Merge**: وقتی کاربر اطلاعات جدیدی درباره یک شغل می‌دهد، سیستم بر اساس `id` یا ترکیب `company + title` شغل را پیدا کرده و فقط فیلدهای خالی را پر می‌کند. اگر توضیحات جدید طولانی‌تر از قبلی باشد، جایگزین می‌شود.
- **Skill Merging**: مهارت‌ها به صورت یک `Set` غیرتکراری (Unique) با هم ادغام می‌شوند تا لیست مهارت‌ها تمیز باقی بماند.

---

## تحلیل پرامپت‌ها (Prompt Engineering Details)

در فایل `src/lib/cv/cv-extraction-prompt.ts`:
- **System Instructions**: دستور العمل‌های صریحی (Lines 62-70) برای عدم خلاصه کردن (Never Summarize) و حفظ زبان اصلی رزومه به AI داده می‌شود.
- **Domain Context (Lines 314-356)**: بر اساس حوزه (مثلا Software), کلمات کلیدی خاصی به پرامپت اضافه می‌شود تا AI بداند دنبال چه مهارت‌هایی بگردد.

---
> این گزارش فنی بر اساس کد تست شده در فایل‌های `src/lib/cv/*.ts` تهیه شده است.

---

## ۴. بهینه‌سازهای فنی (Technical Optimizations)

- **JSON Repair System**: سیستمی برای ترمیم خودکار کدهای JSON ناقص که ممکن است توسط مدل‌های ضعیف‌تر تولید شوند.
- **Smart Retries**: تکرار هوشمند مراحل استخراج در صورت شکست اعتبارسنجی اولیه.
- **Detailed Validation**: بازگشت درصد تکمیل (Completion Percentage) بر اساس حوزه‌های مختلف.

---
> [!NOTE]
> این ماژول در حال حاضر بر روی پایداری داده‌ها (Data Integrity) تمرکز دارد تا کاربر پس از آپلود رزومه، هیچ بخشی از محتوای خود را از دست ندهد.
