#![allow(non_snake_case)]

/// Raw C-bindings for some of Apple's accessibility API. See [Apple's documentation](https://developer.apple.com/documentation/applicationservices/axuielement_h?language=objc#overview)
pub mod raw {
    use core_foundation::string::CFStringRef;
    use core_foundation_sys::base::Boolean;
    use core_foundation_sys::dictionary::CFDictionaryRef;

    extern "C" {
        pub static kAXTrustedCheckOptionPrompt: CFStringRef;

        pub fn AXIsProcessTrusted() -> Boolean;
        pub fn AXIsProcessTrustedWithOptions(theDict: CFDictionaryRef) -> Boolean;

    }
}

/// Wrapped bindings to some of Apple's accessibility client API.
pub mod accessibility {
    use core_foundation::base::TCFType;
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::string::CFString;

    use crate::raw::{
        kAXTrustedCheckOptionPrompt, AXIsProcessTrusted, AXIsProcessTrustedWithOptions,
    };

    /// Checks whether or not this application is a trusted accessibility client.
    pub fn application_is_trusted() -> bool {
        unsafe {
            return AXIsProcessTrusted() != 0;
        }
    }

    /// Same as [application_is_trusted], but also shows the user a prompt asking
    /// them to allow accessibility API access if it hasn't already been given.
    pub fn application_is_trusted_with_prompt() -> bool {
        unsafe {
            let option_prompt = CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt);
            let dict: CFDictionary<CFString, CFBoolean> =
                CFDictionary::from_CFType_pairs(&[(option_prompt, CFBoolean::true_value())]);
            return AXIsProcessTrustedWithOptions(dict.as_concrete_TypeRef()) != 0;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::accessibility::{application_is_trusted, application_is_trusted_with_prompt};

    #[test]
    fn test_application_is_trusted() {
        assert_eq!(false, application_is_trusted());
    }

    #[test]
    fn test_application_is_trusted_with_prompt() {
        assert_eq!(false, application_is_trusted_with_prompt());
    }
}
