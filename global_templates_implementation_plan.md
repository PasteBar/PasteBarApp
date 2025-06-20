# Global Templates Feature Implementation Plan

## 1. Data Storage and State Management (`settingsStore.ts`)

**File:** [`packages/pastebar-app-ui/src/store/settingsStore.ts`](packages/pastebar-app-ui/src/store/settingsStore.ts:1)

**Objective:** Extend the existing Zustand store to manage global templates and their enabled state.

**Changes:**

*   **Extend `Settings` Type (around L107):**
    *   Add `globalTemplatesEnabled: boolean;`
    *   Add `globalTemplates: Array<{ id: string; name: string; value: string; isEnabled: boolean }>;`
*   **Extend `SettingsStoreState` Interface (around L217):**
    *   `setGlobalTemplatesEnabled: (isEnabled: boolean) => void;`
    *   `addGlobalTemplate: (template: { name: string; value: string }) => void;` (Generates ID, sets `isEnabled: true` by default)
    *   `updateGlobalTemplate: (template: { id: string; name?: string; value?: string; isEnabled?: boolean }) => void;`
    *   `deleteGlobalTemplate: (templateId: string) => void;`
    *   `toggleGlobalTemplateEnabledState: (templateId: string) => void;` (Toggles `isEnabled` for a specific template)
*   **Update `initialState` (around L298):**
    *   `globalTemplatesEnabled: true,` (or `false`, based on desired default)
    *   `globalTemplates: [],`
*   **Implement Setter Functions:**
    *   Create implementations for all new setters in the `settingsStore` factory function.
    *   These setters will use `get().updateSetting('settingName', value)`.
    *   For `globalTemplates` (array of objects), it will likely need to be serialized to a JSON string before calling `updateSetting` and deserialized when read, similar to how `protectedCollections` is handled (see L474-L478 which splits/joins a comma-separated string; JSON.stringify/parse will be more robust for an array of objects).
        *   `setGlobalTemplatesEnabled`: Directly updates the boolean.
        *   `addGlobalTemplate`: Gets current `globalTemplates`, adds new, updates.
        *   `updateGlobalTemplate`: Gets current, finds by ID, updates, updates.
        *   `deleteGlobalTemplate`: Gets current, filters out by ID, updates.
        *   `toggleGlobalTemplateEnabledState`: Gets current, finds by ID, toggles `isEnabled`, updates.
    *   Ensure `updateSetting` in the Rust backend can handle a potentially larger string for `globalTemplates`.

## 2. User Interface for Managing Global Templates (`UserPreferences.tsx`)

**File:** [`packages/pastebar-app-ui/src/pages/settings/UserPreferences.tsx`](packages/pastebar-app-ui/src/pages/settings/UserPreferences.tsx:1)

**Objective:** Create a new section in user preferences for managing global templates.

**Changes:**

*   **Add New Card Section:**
    *   Create a new `<Card>` component, similar to existing settings sections (e.g., "Application Auto Start" card).
    *   Title: "Global Templates" (to be internationalized using `templates` namespace, e.g., `t('globalTemplatesTitle', { ns: 'templates' })`).
    *   Description: "Manage reusable text snippets that can be inserted into any clip using {{template_name}}." (internationalized).
*   **Master Enable/Disable Switch:**
    *   Add a `<Switch>` component to toggle `globalTemplatesEnabled` from the `settingsStoreAtom`.
    *   Label: "Enable Global Templates" (internationalized).
*   **Template Management UI (conditionally rendered if `globalTemplatesEnabled` is true):**
    *   **Display List of Global Templates:**
        *   Iterate over `globalTemplates` from `settingsStoreAtom`.
        *   For each template, display:
            *   Name (editable `InputField`)
            *   Value (editable `InputField` or `TextArea` for multi-line)
            *   Enable/Disable toggle per template (`Switch` bound to its `isEnabled` property)
            *   Delete button (`Button` with a trash icon)
    *   **Add New Template Button:**
        *   A `<Button>` (e.g., "Add Template" or "+", internationalized) that calls `addGlobalTemplate` with empty/default name/value.
    *   **UI Components:** Use existing UI components like `InputField`, `Button`, `Switch`, `Flex`, `Box`.
    *   **Event Handlers:**
        *   `onChange` for name/value inputs should call `updateGlobalTemplate` (debounced).
        *   `onCheckedChange` for the per-template switch should call `toggleGlobalTemplateEnabledState`.
        *   `onClick` for delete button should call `deleteGlobalTemplate` (with a confirmation dialog, internationalized).

## 3. Dynamic Template Replacement Logic

**Objective:** Implement the logic to replace `{{template_name}}` placeholders with their corresponding global template values dynamically at the time of display or use.

**Core Idea:** Store clip content with raw `{{template_name}}` placeholders. Replacement happens on-the-fly.

**Changes:**

*   **Create a Helper Function (e.g., `resolveGlobalTemplates(text: string, globalTemplates: GlobalTemplate[], globalTemplatesEnabled: boolean): string`)**
    *   Location: A utility file, e.g., `packages/pastebar-app-ui/src/lib/templateUtils.ts` (new file).
    *   This function will:
        1.  Take the input `text` (clip content), the current array of `globalTemplates` from the store, and the `globalTemplatesEnabled` flag.
        2.  If `globalTemplatesEnabled` is false, return `text` as is.
        3.  Use a regex like `/\{\{([\w\s-]+?)\}\}/g` to find all `{{template_name}}` occurrences.
        4.  For each match, extract `template_name`.
        5.  Look up `template_name` in the `globalTemplates` array.
            *   If found and the specific global template `isEnabled` is true, replace `{{template_name}}` with its `value`.
            *   If not found, or if the found global template is disabled, leave the placeholder `{{template_name}}` as is.
        6.  Return the modified text.
*   **Integration Points (where `resolveGlobalTemplates` should be called):**
    *   **[`ClipCardBody.tsx`](packages/pastebar-app-ui/src/pages/components/Dashboard/components/ClipCardBody.tsx:1) (or similar component responsible for rendering clip content):**
        *   When displaying clip content, pass it through `resolveGlobalTemplates` before rendering.
    *   **[`useCopyClipItem.ts`](packages/pastebar-app-ui/src/hooks/use-copypaste-clip-item.ts:1):**
        *   When a clip is copied, its `value` should be processed by `resolveGlobalTemplates` before being written to the actual clipboard.
    *   **[`usePasteClipItem.ts`](packages/pastebar-app-ui/src/hooks/use-copypaste-clip-item.ts:1) (and related pasting logic):**
        *   When a clip is pasted, its content should be resolved.
    *   **Quick Paste Window:** If it displays clip content directly, that display logic also needs to use the resolver.
    *   **Anywhere else clip content is "used" or "outputted".**

## 4. Local vs. Global Template Conflict Handling (`ClipEditTemplate.tsx`)

**File:** [`packages/pastebar-app-ui/src/pages/components/Dashboard/components/ClipEditTemplate.tsx`](packages/pastebar-app-ui/src/pages/components/Dashboard/components/ClipEditTemplate.tsx:1)

**Objective:** Warn the user if they try to create a local template field with the same name as an existing enabled global template, but allow it, noting local precedence.

**Changes:**

*   **Access Global Templates:**
    *   Inside `ClipEditTemplate`, use `useAtomValue(settingsStoreAtom)` to get `globalTemplates` and `globalTemplatesEnabled`.
*   **Modify Logic for Adding/Editing Local Template Fields:**
    *   When a user tries to add a new local template field or finishes editing the label of an existing one:
        1.  Get the proposed `label` for the local template.
        2.  If `globalTemplatesEnabled` is true, check if any `template` in `globalTemplates` has `template.name === label` and `template.isEnabled === true`.
        3.  If a conflict is found:
            *   Display a non-modal warning message (internationalized using `templates` namespace, e.g., `t('localTemplateConflictWarning', { ns: 'templates', label })`).
            *   Proceed with adding/updating the local template field.

## 5. Internationalization (i18n)

**Objective:** Ensure all new user-facing strings are translatable using a new `templates.yaml` namespace.

**Changes:**

*   **Create `templates.yaml` Namespace Files:**
    *   For each supported language (e.g., `en`, `es`, `fr`) under `packages/pastebar-app-ui/src/locales/lang/`, create a new file: `templates.yaml`.
    *   Example `packages/pastebar-app-ui/src/locales/lang/en/templates.yaml`:
        ```yaml
        globalTemplatesTitle: "Global Templates"
        globalTemplatesDescription: "Manage reusable text snippets that can be inserted into any clip using {{template_name}}."
        enableGlobalTemplatesLabel: "Enable Global Templates"
        addTemplateButton: "Add Template"
        templateNameLabel: "Name"
        templateValueLabel: "Value"
        templateEnabledLabel: "Enabled"
        deleteTemplateButtonTooltip: "Delete Template"
        confirmDeleteTemplateTitle: "Confirm Delete"
        confirmDeleteTemplateMessage: "Are you sure you want to delete the global template '{{name}}'?"
        localTemplateConflictWarning: "A global template named '{{label}}' also exists. The local template will take precedence within this clip's form."
        # ... any other new strings related to this feature
        ```
    *   Add corresponding translations to `templates.yaml` for other supported languages.
*   **Update i18n Configuration:**
    *   Ensure the new `templates` namespace is loaded by i18next. This might involve:
        *   Checking if the i18n setup (e.g., in `packages/pastebar-app-ui/src/locales/index.ts` or related Vite plugins like `i18n-vite-loaded`) automatically picks up new `.yaml` files.
        *   If not, explicitly add `templates` to the list of namespaces in the i18next initialization options.
*   **Use `t` Function with Namespace:**
    *   In [`UserPreferences.tsx`](packages/pastebar-app-ui/src/pages/settings/UserPreferences.tsx:1) and [`ClipEditTemplate.tsx`](packages/pastebar-app-ui/src/pages/components/Dashboard/components/ClipEditTemplate.tsx:1) where new strings are added:
        *   Either get `t` with the namespace: `const { t } = useTranslation('templates');`
        *   Or specify the namespace per usage: `t('myStringKey', { ns: 'templates' })`.
    *   Wrap all new UI strings with `t('stringKeyFromTemplatesYaml')`.

## 6. Testing Considerations

*   **Unit Tests:**
    *   For `resolveGlobalTemplates` helper function.
    *   For `settingsStore` setters related to global templates.
*   **Integration Tests (if applicable):**
    *   Test the flow of adding/editing/deleting global templates.
    *   Test dynamic replacement.
    *   Test conflict warning.
*   **Manual Testing:**
    *   Verify UI in `UserPreferences`.
    *   Verify persistence.
    *   Verify dynamic replacement in various scenarios.
    *   Verify conflict handling.
    *   Verify i18n for all new strings in the `templates` namespace.

## Visual Overview (Mermaid Diagram)

```mermaid
graph TD
    subgraph UserPreferencesUI [UserPreferences.tsx]
        A1[Card: Global Templates] --> A2{Enable Global Templates Switch};
        A2 -- Enables --> A3[Templates List UI];
        A3 --> A4[Template Item: Name, Value, EnableSwitch, DeleteBtn];
        A3 --> A5[Add New Template Button];
    end

    subgraph SettingsStore [settingsStore.ts]
        B1[State: globalTemplatesEnabled (bool)];
        B2[State: globalTemplates (array)];
        B3[Actions: setGlobalTemplatesEnabled, add/update/deleteGlobalTemplate, toggleGlobalTemplateEnabledState];
        B1 <--> A2;
        B2 <--> A3;
        B3 -- Called by --> A3;
        B3 -- Called by --> A5;
    end

    subgraph ClipProcessing
        C1[Clip Content with {{placeholder}}] --> C2[resolveGlobalTemplates Utility];
        SettingsStore -- Provides data to --> C2;
        C2 --> C3[Resolved Clip Content];
    end

    subgraph ClipDisplay [ClipCardBody.tsx, etc.]
        D1[Display Logic] -- Uses --> C2;
    end

    subgraph ClipCopyPaste [useCopyClipItem.ts, etc.]
        E1[Copy/Paste Logic] -- Uses --> C2;
    end

    subgraph ClipEditTemplateUI [ClipEditTemplate.tsx]
        F1[Add/Edit Local Template Label] --> F2{Check Global Conflict};
        SettingsStore -- Provides data to --> F2;
        F2 -- If conflict --> F3[Show Warning: Local Precedence];
    end

    subgraph I18N [Internationalization]
        G1[templates.yaml files for each language]
        G2[i18next config loads 'templates' namespace]
        UserPreferencesUI -- Uses translations from --> G1;
        ClipEditTemplateUI -- Uses translations from --> G1;
    end

    UserPreferencesUI -- Interacts with --> SettingsStore;
    ClipEditTemplateUI -- Interacts with --> SettingsStore;