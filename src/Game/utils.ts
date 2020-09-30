export function shuffle<T>(arr: T[]) {
  let i = arr.length;
  let j: number;
  let temp: any;
  while (--i > 0) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
  return arr;
}
