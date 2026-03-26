export interface ChassidicEvent {
  day: number;
  month: number; // 1-indexed, 1=Nisan, 7=Tishrei, etc.
  title: string;
  description: string;
  isGeulah?: boolean;
}

export const CHABAD_EVENTS: ChassidicEvent[] = [
  { day: 6, month: 7, title: "ו' תשרי", description: "הילולת הרבנית חנה - אמו של הרבי מליובאוויטש" },
  { day: 13, month: 7, title: "י\"ג תשרי", description: "הילולת אדמו\"ר המהר\"ש - האדמו\"ר הרביעי מחב\"ד, בעל ה'לכתחילה אריבער'" },
  { day: 20, month: 7, title: "כ' תשרי", description: "הילולת רבי לוי יצחק - אביו של הרבי ורבה של יקטרינוסלב" },
  { day: 20, month: 8, title: "כ' מרחשון", description: "יום הולדת אדמו\"ר הרש\"ב - האדמו\"ר החמישי ומייסד ישיבת תומכי תמימים" },
  { day: 9, month: 9, title: "ט' כסלו", description: "הולדת והילולת אדמו\"ר האמצעי - האדמו\"ר השני מחב\"ד" },
  { day: 10, month: 9, title: "י' כסלו", description: "גאולת אדמו\"ר האמצעי - יום שחרורו ממאסר ברוסיה" },
  { day: 14, month: 9, title: "י\"ד כסלו", description: "יום נישואי הרבי והרבנית - יום נישואי הרבי והרבנית חיה מושקא בשנת תרפ\"ט" },
  { day: 19, month: 9, title: "י\"ט כסלו", description: "חג הגאולה - ראש השנה לחסידות ושחרור אדמו\"ר הזקן", isGeulah: true },
  { day: 20, month: 9, title: "כ' כסלו", description: "חג הגאולה - המשך השמחה", isGeulah: true },
  { day: 5, month: 10, title: "ה' טבת", description: "דידן נצח - יום ניצחון הספרים במשפט הספרייה" },
  { day: 24, month: 10, title: "כ\"ד טבת", description: "הילולת אדמו\"ר הזקן - מייסד חסידות חב\"ד ובעל ספר התניא" },
  { day: 10, month: 11, title: "י' שבט", description: "הילולת אדמו\"ר הריי\"צ - האדמו\"ר השישי מחב\"ד" },
  { day: 11, month: 11, title: "י\"א שבט", description: "קבלת נשיאות הרבי - היום בו קיבל הרבי את הנהגת חב\"ד בשנת תשי\"א" },
  { day: 22, month: 11, title: "כ\"ב שבט", description: "הילולת הרבנית חיה מושקא - רעייתו של הרבי" },
  { day: 25, month: 12, title: "כ\"ה אדר", description: "יום הולדת הרבנית חיה מושקא" },
  { day: 2, month: 1, title: "ב' ניסן", description: "הילולת אדמו\"ר הרש\"ב - האדמו\"ר החמישי מחב\"ד" },
  { day: 11, month: 1, title: "י\"א ניסן", description: "יום הולדת הרבי - יום הולדת הרבי מליובאוויטש" },
  { day: 13, month: 1, title: "י\"ג ניסן", description: "הילולת אדמו\"ר הצמח צדק - האדמו\"ר השלישי מחב\"ד" },
  { day: 2, month: 2, title: "ב' אייר", description: "יום הולדת אדמו\"ר המהר\"ש - האדמו\"ר הרביעי מחב\"ד" },
  { day: 14, month: 2, title: "י\"ד אייר", description: "פסח שני - מסמל ש'אין דבר אבוד'" },
  { day: 18, month: 2, title: "י\"ח אייר", description: "ל\"ג בעומר - הילולת רשב\"י וגילוי תורת הסוד" },
  { day: 28, month: 3, title: "כ\"ח סיון", description: "הצלת הרבי והרבנית - הגעתם לארה\"ב בשנת תש\"א מהשואה" },
  { day: 3, month: 4, title: "ג' תמוז", description: "יום הילולת הרבי - יום פטירת הרבי מליובאוויטש בשנת תשנ\"ד" },
  { day: 12, month: 4, title: "י\"ב תמוז", description: "חג הגאולה אדמו\"ר הריי\"צ - שחרורו ממאסר הסובייטים", isGeulah: true },
  { day: 13, month: 4, title: "י\"ג תמוז", description: "חג הגאולה אדמו\"ר הריי\"צ - שחרורו ממאסר הסובייטים", isGeulah: true },
  { day: 20, month: 5, title: "כ' מנחם אב", description: "הילולת רבי לוי יצחק - אביו של הרבי בגלות קזחסטן" },
  { day: 18, month: 6, title: "ח\"י אלול", description: "יום הולדת הבעש\"ט ואדה\"ז - יום הולדת שני המאורות הגדולים" },
];

export function getChassidicEvent(day: number, month: number): ChassidicEvent | undefined {
  return CHABAD_EVENTS.find(e => e.day === day && e.month === month);
}
