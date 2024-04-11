use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
  pub static ref SHEBANG_MAP: HashMap<&'static str, &'static str> = {
    let mut m = HashMap::new();
    m.insert("node", "javascript");
    m.insert("jsc", "javascript");
    m.insert("rhino", "javascript");
    m.insert("deno", "javascript");
    m.insert("python3", "python");
    m.insert("python2", "python");
    m.insert("php", "php");
    m.insert("perl", "perl");
    m.insert("bash", "shell");
    m.insert("sh", "shell");
    m.insert("zsh", "shell");
    m
  };
}
