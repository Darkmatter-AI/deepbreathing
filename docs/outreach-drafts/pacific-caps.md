# University of the Pacific CAPS — Relaxation and Breathing Exercises

## Target
- **Name:** University of the Pacific, Counseling and Psychological Services
- **URL:** https://www.pacific.edu/student-life/student-services/counseling-and-psychological-services/self-help-resources/relaxation-and-mindfulness
- **CRM row:** §2 University / library resource pages, row 6 (🟡)

## Channel
Phone only, 209-946-2315. No email address on the page. This one needs a call or a general-enquiry form, which makes it higher effort than its priority suggests.

## Hook evidence
- **URL fetched:** https://www.pacific.edu/.../relaxation-and-mindfulness
- **Fetched:** 2026-07-19 ~21:57 UTC, HTTP 200
- **Verified:** yes, and **the CRM row is wrong.** It says to "verify the exact dead audio URLs before emailing". I did. The audio is fine.
  - Page title is "Relaxation and Breathing Exercises", with "Relaxation Audio Clips... used with the permission of Hobart and William Smith Colleges Counseling Center".
  - Both hws.edu mp3s return **HTTP 200 and play**: `CC%20Website%20Relax%20Steve.mp3` and `CC%20Website%20Relax%20Bonnie.mp3`. They are linked over plain `http://` but redirect cleanly to https.
- **The real hook is the other outbound links.** Of the four non-audio external links on the page, three are broken or no longer reach what the page names:
  1. `counseling.iastate.edu/mind-body/mind-body-spa` → **HTTP 404, dead.**
  2. `marc.ucla.edu/mindful-meditations` → redirects to `uclahealth.org/uclamindful`, a different page.
  3. `cmhc.utexas.edu/stressrecess/index.html` ("Stress Recess") → redirects to the generic `healthyhorns.utexas.edu/cmhc/` homepage. The named resource is gone.
  4. `mindful.org/the-three-minute-breathing-space-practice/` → still resolves.
- All link-rot checks run 2026-07-19 ~21:58 UTC.

## Draft

Adapt for a phone call, or send through the general CAPS enquiry route if one exists. The specifics are the whole value here, so lead with them.

**Subject:** Three broken links on your Relaxation and Breathing Exercises page

Your relaxation page has some link rot. The Iowa State mind-body spa link returns a 404. The UCLA MARC link now redirects to a different UCLA Health page. The UT Austin "Stress Recess" link lands on their counseling homepage rather than the resource you named. Your two Hobart and William Smith audio clips are fine and still play.

I build deepbreathingexercises.com, a free browser tool for paced breathing. No install, no account, no cost, and it works on managed campus machines. Box, 4-7-8, coherent, physiological sigh, adjustable pace, one to five minutes.

Worth a slot in place of one of the three dead links?

Abi
deepbreathingexercises.com
