use std::cmp::Ordering;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Hlc {
  pub wall_ms: i64,
  pub counter: i32,
}

pub fn compare_hlc(a: Hlc, b: Hlc) -> Ordering {
  (a.wall_ms, a.counter).cmp(&(b.wall_ms, b.counter))
}
