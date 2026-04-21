# Agentic Medical Device Reviewer – Comprehensive Technical Specification (v3.2)

## 1. Executive Summary

The **Agentic Medical Device Reviewer (AMDR)** is a high-fidelity, industrial-grade intelligence platform engineered to revolutionize the regulatory review lifecycle for medical device manufacturers and regulatory bodies (specifically targeting **FDA 510(k)** and **TFDA Taiwan** submissions). In an era where technical documentation can span thousands of pages of biomechanical testing, clinical data, and software validation, AMDR serves as a high-speed "Agentic Co-pilot" that automates the most labor-intensive aspects of document auditing.

This specification details the architecture, design philosophy, and functional logic of the AMDR platform. It emphasizes a **"WOW UI" philosophy**—combining extreme technical utility with a **Frosted Glass (Glassmorphism)** aesthetic and reactive visual feedback systems. By leveraging the **Gemini 3.1 Flash Preview** engine, the platform provides deep semantic reasoning capable of generating 4000-word regulatory summaries with high structural integrity.

---

## 2. Product Vision and Core Philosophy

### 2.1 The Regulatory Challenge
Medical device regulation is defined by its rigidity and the sheer volume of "Objective Evidence" required. Reviewers must cross-examine claims across multiple disjointed sections (e.g., verifying that a fatigue testing claim in Section 12 matches the raw data in Appendix G). Traditional PDF viewers are inadequate for these non-linear tasks.

### 2.2 The Agentic Solution
AMDR is not just a "GPT Wrapper." It is an **Agentic System** that:
- **Parses and Extracts**: Uses client-side processing to isolate relevant document segments.
- **Audits and Maps**: Cross-references claims against regulatory standards (ISO/FDA).
- **Predicts and Flags**: Identifies missing evidence or potential "Refusal to Accept" (RTA) triggers before submission.
- **Synthesizes and Celebrates**: Provides massive, formatted summaries and uses high-impact visual effects to signal task finalization.

---

## 3. Design Philosophy: Light Frosted Glass (Glassmorphism)

The visual identity of AMDR is built on the **"Sleek & Professional"** theme, utilizing a **Light Frosted Glass** style. This design choice is intentional: it conveys transparency (critical in regulation) and modern precision.

### 3.1 Visual Layering
- **Atmospheric Background**: A soft, animated gradient background (`bg-blue-50/20`) provides depth without distracting the user.
- **Glass Containers**: Components use `backdrop-blur-3xl` and `bg-white/40`. This creates a floating, ethereal effect where the document "floats" above the data workspace.
- **Frosted Borders**: Each panel is encased in a thin, transluscent `border-white/50` stroke, mimicking the refractive edge of cut glass.

### 3.2 Typography and Hierarchy
- **Primary Typeface**: **Inter / System Sans-serif**. Chosen for its high legibility in dense data environments.
- **Data Accents**: **JetBrains Mono** or standard system mono fonts are used for Live Logs and Token Metrics to differentiate "Machine Output" from "Human Output."
- **Color Palette**: 
  - **Indigo/Blue**: Primary action colors and navigation.
  - **Emerald**: Success states and verified regulatory claims.
  - **Rose/Coral**: Deficiency flags, "Red Flag" highlights, and important bolded keywords.

---

## 4. Technical Architecture

AMDR is a full-stack React application designed for high-concurrency document processing.

### 4.1 Frontend Framework
- **React 19 + Vite**: Chosen for ultra-fast HMR and production builds.
- **Tailwind CSS 4**: Utilizes the modern CSS-in-JS engine for complex translucency and layout management.
- **Motion (Framer Motion)**: Powers the "Status Cards" and "WOW Visualizations," handling complex hardware-accelerated animations.

### 4.2 Document Processing Engine
- **PDF-Lib**: Unlike standard viewers, AMDR uses `pdf-lib` to perform high-speed page extraction and document synthesis entirely within the client's memory, ensuring data privacy and speed.
- **React-Markdown + Remark-Gfm**: Essential for rendering the 4000-word summaries, preserving tables, footnotes, and bolded coral-colored keywords.

### 4.3 AI Engine (Google GenAI)
- **Primary Model**: `gemini-3-flash-preview` (mapped to the 2.5/3.1 endpoints). This model is selected for its massive context window and its ability to maintain structural coherence in long-form generation.
- **SDK**: `@google/genai` (Vite-optimized).

---

## 5. Functional Module Breakdown

### 5.1 PDF Intelligence & Selective Extraction
The **PDF Tab** is the primary entry point for formal document review.
- **Selective Page Trimming**: Users can input complex numerical ranges (e.g., `1, 3-5, 12-25, 100`). The system then uses the `PDFDocument` API to copy specific pages into a new memory-buffer.
- **Immediate Export**: The trimmed PDF is available for instant download, allowing the reviewer to provide a "Focussed Review Memo" containing only the critical proof documents.
- **Comprehensive Summary (The "Master Review")**: 
  - **Word Count**: The agent is prompted to generate between **3000 and 4000 words**.
  - **5 Mandatory Tables**: Summarizes (1) Technical Specifications, (2) Materials & Biocompatibility, (3) Risk Management, (4) Comparison with Predicate Devices, and (5) Clinical Testing results.
  - **20 Entities**: Every summary must identify 20 named entities (Standards, Materials, Competitors, Testing Labs) with specific context about their role in the device's story.
  - **20 Questions**: The final section generates 20 probes designed to test the device's documentation for weaknesses (e.g., "Why was the fatigue testing truncated at 5 million cycles instead of the ISO recommended 10 million?").

### 5.2 AI Note Keeper & Context Chaining
The **Notes Tab** is for messy, "dirty" work—pasting meeting transcripts, clinical observations, or rough drafts.
- **Prompt Architect**: A permanent text area for "Custom Directives." This is injected into every AI call, allowing the user to say "Keep the tone extremely critical" or "Output in a TFDA-specific format."
- **Context Persistence**: The system maintains the current Markdown state as a seed for the next prompt, allowing "Incremental Refinement."

### 5.3 The "AI Magic" Suite (9 Intelligent Agents)
These are one-click "Micro-Agents" that process the current document:
1. **AI Magic Reorganization**: Flattens chaotic text into a standard TFDA/FDA Table of Contents structure.
2. **AI Keywords**: Scans the text and wraps sensitive regulatory terms in `**bold**`, which the UI renders as Coral text.
3. **Consistency Auditor**: A deep-reasoning pass that specifically looks for numerical or claim-based contradictions between sections.
4. **Regulatory Mapping**: Links document claims to specific ISO (e.g., ISO 13485) or ASTM clauses as footnotes.
5. **Deficiency Predictor**: Uses RTA (Refusal to Accept) logic to predict if a reviewer would reject the file.
6. **Executive Summary**: A management-ready briefing.
7. **Action Items**: A markdown table of delegated tasks.
8. **Glossary Builder**: A bilingual (EN/CT) dictionary of terms found in the file.
9. **Format Polisher**: Standardizes all spacing, headers, and bullet styles.

---

## 6. WOW UI: Feedback Systems and celebration

AMDR prioritizes the psychological state of the user through reactive UI.

### 6.1 Floating Real-time Status Card
A prominent, rounded card that pulses in the bottom-center of the screen.
- **State Feedback**: Displays the current "Agent Thought" (e.g., "Reasoning through Section 4...").
- **Visual Glow**: Uses a `shadow-blue-500/30` pulsing glow to indicate active computation.
- **Non-blocking UI**: It floats above the workspace, allowing the user to read logs while the generator works.

### 6.2 Agent Live Linkage (Terminal)
A high-contrast black terminal window (`bg-slate-900`) showing the "Inner Thoughts" of the AI.
- **Event Streaming**: Every sub-task (Initializing, Transmitting, Parsing, Success) is timestamped.
- **Error Transparency**: Displays raw API errors in `text-red-400` for immediate debugging.

### 6.3 WOW Visualization Engine
Post-execution, the platform triggers one of 6 user-selected effects:
1. **Confetti**: High-energy celebration of a completed 4000-word run.
2. **Matrix Rain**: Vertical green characters overlaying the glass UI—perfect for "Data Extraction" tasks.
3. **Glowing Pulse**: A clean, expanding blue ripple that clears the UI of "noise."
4. **Aurora Waves**: Slow-moving, painterly gradient patterns that flow across the background.
5. **Data Particles**: Swarming white dots that coalesce into the final text container.
6. **Laser Scan**: A horizontal scanning beam that "inspects" the document one final time.

---

## 7. Data and Model Strategy

### 7.1 Selection Logic
- **Default Strategy**: `gemini-3-flash-preview` is chosen for its price-to-performance ratio in long-form generation.
- **Precision Mode**: `gemini-1.5-pro` is available for higher-complexity auditing tasks like the "Consistency Auditor."

### 7.2 Token Management
- **Dashboard Tracking**: The "WOW Performance Matrix" displays actual token counts.
- **Review Index**: A complex algorithm calculates "Complexity Score" based on token density and entity count, visualized as a bar chart.

---

## 8. Scalability and Global Compliance

AMDR is designed for global deployment:
- **Language Localization**: Built-in support for **Traditional Chinese (Taiwan standard)** and **English**.
- **Regulatory Frameworks**: Extendable agent behavior through the `MAGICS` config array, permitting easy addition of EU MDR or NMPA (China) specific agents in the future.

---

## 9. 20 Comprehensive Follow-Up Questions

1. **Hallucination Prevention**: What specific validation steps are implemented to ensure the 20 generated entities actually exist in the source document and aren't invented by the AI?
2. **Word Count Strictness**: How does the prompt engineering handle the word-count "floor" (e.g., ensuring the AI doesn't stop at 1000 words)?
3. **Frosted UI Accessibility**: How does the Light Frosted Glass theme handle WCAG AA contrast requirements for low-vision users?
4. **PDF Security**: If a user uploads a password-protected PDF, how does the `pdf-lib` integration handle authentication?
5. **Matrix Rain Performance**: Does the Matrix Rain visualization use a Canvas 2D context or a heavy DOM-based approach, and how does it impact low-powered devices?
6. **Token Accumulation**: In the "Context Chaining" system, how do we prevent the prompt from exceeding the 1M token limit during a 10-hour working session?
7. **Consistency Logic**: For the "Consistency Auditor," how does the AI keep track of disparate numerical data points across 3000 words?
8. **Export Formats**: Will the platform support exporting the final 4000-word summary directly to a standard TFDA .DOCX template?
9. **Laser Scan Sync**: Is the "Laser Scan" visualization synced to the actual markdown rendering progress, or is it a timed decorative overlay?
10. **Bilingual Nuance**: How will the Glossary Builder handle medical acronyms that have multiple Traditional Chinese interpretations in different healthcare regions?
11. **RTA Risk Weights**: How are the "Deficiency Predictor" risks weighted (e.g., is a missing date more critical than a mismatched symbol)?
12. **Status Card Positioning**: How is the Status Card managed during window resizing to prevent it from overlapping critical sidebar controls?
13. **Markdown Logic**: Will the viewer support nested Mermaid.js diagrams if the AI tries to visualize a device's software architecture?
14. **Custom Prompt Security**: How do we sanitize "Custom Directives" to prevent users from performing prompt injection on themselves or the underlying agent?
15. **Offline Support**: Is there a "Draft Persistence" mode that saves the current notes to local storage in case the user's browser crashes?
16. **Visualization Choices**: Why were these specific 6 WOW effects chosen, and can users upload their own CSS-based effects in the future?
17. **Entity Profiles**: Are the 20 entity profiles stored in a relational way so that clicking an entity "Organization A" highlights all its occurrences in the text?
18. **Table Logic**: If the PDF contains complex tables, how does the AI transform them into clean Markdown without losing row/column alignment?
19. **Regulatory Origin footnotes**: Do the "Regulatory Origin" footnotes link to live external FDA/ISO databases, or are they static citations?
20. **Complexity Score Algorithm**: What specific weights are given to "Token Volume" vs "Entity Count" when calculating the final 1-10 Review Complexity index?
