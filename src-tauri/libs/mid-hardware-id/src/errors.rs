use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum MIDError {
    ExecuteProcessError(std::io::Error),
    ParseError(std::string::FromUtf8Error),
    ResultMidError,
    EmptyMidKey,
}

impl Error for MIDError {}

impl fmt::Display for MIDError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MIDError::ExecuteProcessError(e) => {
                write!(f, "Failed to execute process: {}", e)
            }
            MIDError::ParseError(e) => {
                write!(f, "Error converting output to UTF-8: {}", e)
            }
            MIDError::ResultMidError => {
                write!(f, "Empty result machine ID")
            }
            MIDError::EmptyMidKey => {
                write!(f, "The key can't be empty")
            }
        }
    }
}
