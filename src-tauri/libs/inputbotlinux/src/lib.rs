use libxdo_sys as xdo;

use std::ffi::CString;
pub struct SimpleVitrualKeySender {
    inner: *mut xdo::xdo_t
}

impl SimpleVitrualKeySender {
    pub fn new(display: Option<&str>) -> Result<Self, ()> {
        let cstr = display.map(|v| CString::new(v).expect("wrong display data"));

        let display_ptr = match cstr {
            Some(v) => v.as_ptr(),
            None => std::ptr::null()
        };

        let inner = unsafe { xdo::xdo_new(display_ptr) };
        Ok(Self { inner })
    }

    pub fn send(&self, sequence: &str) -> () {
        let string = CString::new(sequence).unwrap();
        unsafe {
            match xdo::xdo_send_keysequence_window(self.inner, xdo::CURRENTWINDOW, string.as_ptr(), 0) {
                0 => (),
                error => panic!("error {error}")
            }
        }
    }

    pub fn send_down(&self, sequence: &str) -> () {
        let string = CString::new(sequence).unwrap();
        unsafe {
            match xdo::xdo_send_keysequence_window_down(self.inner, xdo::CURRENTWINDOW, string.as_ptr(), 0) {
                0 => (),
                error => panic!("error {error}")
            }
        }
    }

    pub fn send_up(&self, sequence: &str) -> () {
        let string = CString::new(sequence).unwrap();
        unsafe {
            match xdo::xdo_send_keysequence_window_up(self.inner, xdo::CURRENTWINDOW, string.as_ptr(), 0) {
                0 => (),
                error => panic!("error {error}")
            }
        }
    }
}
