import { ComplexZmanimCalendar, GeoLocation, JewishCalendar, HebrewDateFormatter } from 'kosher-zmanim';
import { addDays, isAfter } from 'date-fns';
import { getChassidicEvent, ChassidicEvent } from './chabadEvents';

export interface Zman {
  name: string;
  time: Date | null;
  description: string;
}

export interface ZmanimData {
  hebrewDate: string;
  hebrewDay: number;
  hebrewMonth: number;
  hebrewYear: number;
  zmanim: Zman[];
  isNextDay: boolean;
  chassidicEvent?: ChassidicEvent;
  parsha?: string;
  specialDay?: string;
  candleLighting?: Date | null;
  havdalah?: Date | null;
  fastStart?: Date | null;
  fastEnd?: Date | null;
}

export function safeFormatHebrewNumber(formatter: HebrewDateFormatter, num: number): string {
  if (!Number.isInteger(num)) return String(num);
  try {
    return formatter.formatHebrewNumber(num);
  } catch (e) {
    console.error("formatHebrewNumber failed for", num, e);
    return String(num);
  }
}

export function calculateZmanim(
  date: Date,
  latitude: number,
  longitude: number,
  altitude: number = 0,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  autoShift: boolean = false
): ZmanimData {
  try {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || isNaN(date.getTime())) {
      console.error("calculateZmanim called with invalid inputs:", { latitude, longitude, date });
      throw new Error("Invalid inputs to calculateZmanim: Non-finite or NaN detected");
    }
    
    // Basic range validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid coordinates: lat=${latitude}, lon=${longitude}`);
    }

    let location: GeoLocation;
    try {
      location = new GeoLocation("Current Location", latitude, longitude, Math.floor(Number.isFinite(altitude) ? altitude : 0), timezone);
    } catch (e) {
      console.error("Failed to create GeoLocation, falling back to UTC", e);
      location = new GeoLocation("Current Location", latitude, longitude, 0, "UTC");
    }

    const calendar = new ComplexZmanimCalendar(location);
    
    // Use a clean date for initial setup (no time components)
    const cleanInitialDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    calendar.setDate(cleanInitialDate);

    let targetDate = cleanInitialDate;
    let isNextDay = false;

    if (autoShift) {
      const sunset = calendar.getSunset();
      isNextDay = sunset ? isAfter(new Date(), sunset.toJSDate()) : false;
      if (isNextDay) {
        targetDate = addDays(cleanInitialDate, 1);
      }
    }
    
    const jewishCalendar = new JewishCalendar();
    jewishCalendar.setInIsrael(false); // Default to Diaspora, can be a setting later
    
    // Use explicit Gregorian date setting which is often more stable
    jewishCalendar.setGregorianDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const jYear = jewishCalendar.getJewishYear();
    const jMonth = jewishCalendar.getJewishMonth();
    const jDay = jewishCalendar.getJewishDayOfMonth();

    if (!Number.isFinite(jYear) || !Number.isFinite(jMonth) || !Number.isFinite(jDay)) {
      console.error("Jewish calendar returned non-finite values", { jYear, jMonth, jDay, targetDate });
      // Fallback to a safe state instead of crashing
      jewishCalendar.setJewishDate(5784, 1, 1);
    } else {
      jewishCalendar.setJewishDate(
        Math.round(jYear),
        Math.round(jMonth),
        Math.round(jDay)
      );
    }
    calendar.setDate(targetDate);

    const formatter = new HebrewDateFormatter();
    formatter.setHebrewFormat(true);
    
    let hebrewDateStr = "";
    let chassidicEvent: ChassidicEvent | undefined;
    
    try {
      const hDay = Math.round(jewishCalendar.getJewishDayOfMonth());
      const hMonth = Math.round(jewishCalendar.getJewishMonth());
      const hYear = Math.round(jewishCalendar.getJewishYear());
      
      if (!Number.isInteger(hDay) || !Number.isInteger(hMonth) || !Number.isInteger(hYear)) {
        throw new Error("Jewish date components are not integers or are NaN/Infinite");
      }
      
      let monthStr = "";
      try {
        monthStr = formatter.formatMonth(jewishCalendar);
      } catch (e) {
        console.error("Month formatting failed", e);
        monthStr = String(hMonth);
      }
      
      hebrewDateStr = `${safeFormatHebrewNumber(formatter, hDay)} ${monthStr} ${safeFormatHebrewNumber(formatter, hYear)}`;
      chassidicEvent = getChassidicEvent(hDay, hMonth);
    } catch (e) {
      console.error("Hebrew date formatting failed", e);
      hebrewDateStr = "שגיאה בתאריך";
    }

    // Special Info
    // For Parsha, we usually want the parsha of the upcoming Shabbat
    const upcomingShabbat = new JewishCalendar();
    // Ensure we start with a clean date
    const cleanTargetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    if (!isNaN(cleanTargetDate.getTime())) {
      try {
        upcomingShabbat.setDate(cleanTargetDate);
        
        const uYear = upcomingShabbat.getJewishYear();
        const uMonth = upcomingShabbat.getJewishMonth();
        const uDay = upcomingShabbat.getJewishDayOfMonth();
        
        if (Number.isFinite(uYear) && Number.isFinite(uMonth) && Number.isFinite(uDay)) {
          upcomingShabbat.setJewishDate(
            Math.round(uYear),
            Math.round(uMonth),
            Math.round(uDay)
          );
        } else {
          upcomingShabbat.setJewishDate(5784, 1, 1);
        }

        // Safety counter to prevent infinite loops
        let tempDate = new Date(cleanTargetDate.getTime());
        let safetyCounter = 0;
        while (upcomingShabbat.getDayOfWeek() !== 7 && safetyCounter < 7) {
          tempDate = addDays(tempDate, 1);
          upcomingShabbat.setDate(tempDate);
          safetyCounter++;
        }
      } catch (e) {
        console.error("Upcoming Shabbat calculation failed", e);
      }
    }
    
    let parsha = "";
    try {
      const p = upcomingShabbat.getParsha();
      if (typeof p === 'number' && Number.isInteger(p) && p >= 0) {
        parsha = formatter.formatParsha(p);
      }
    } catch (e) {
      console.error("Parsha formatting failed", e);
    }

    let specialDay = "";
    try {
      if (jewishCalendar.isRoshChodesh()) {
        try {
          specialDay = formatter.formatRoshChodesh(jewishCalendar);
        } catch (e) {
          console.error("Rosh Chodesh formatting failed", e);
          specialDay = "ראש חודש";
        }
      } else {
        try {
          const yomTov = formatter.formatYomTov(jewishCalendar);
          if (yomTov) {
            specialDay = yomTov;
          } else if (jewishCalendar.getDayOfWeek() === 7) {
            specialDay = "שבת קודש";
          }
        } catch (e) {
          console.error("Yom Tov formatting failed", e);
        }
      }
    } catch (e) {
      console.error("Special day logic failed", e);
    }

    // Candle Lighting / Havdalah
    let candleLighting: Date | null = null;
    let havdalah: Date | null = null;

    if (jewishCalendar.hasCandleLighting()) {
      candleLighting = calendar.getCandleLighting()?.toJSDate() || null;
    }

    // Havdalah is after Shabbat or Yom Tov
    const tomorrow = new JewishCalendar();
    tomorrow.setDate(addDays(targetDate, 1));
    
    // If today is Shabbat or Yom Tov (Assur B'Melacha) and tomorrow is not
    if ((jewishCalendar.getDayOfWeek() === 7 || jewishCalendar.isYomTovAssurBemelacha()) && !tomorrow.isAssurBemelacha()) {
      // Chabad custom for Havdalah is often 8.5 degrees or 42 minutes. 
      // getTzaisGeonim8Point5Degrees is a safe astronomical standard.
      havdalah = calendar.getTzaisGeonim8Point5Degrees()?.toJSDate() || null;
    }

    // Fast times
    let fastStart: Date | null = null;
    let fastEnd: Date | null = null;

    if (jewishCalendar.isTaanis()) {
      if (jewishCalendar.getYomTovIndex() === JewishCalendar.TISHA_BEAV) {
        // Tisha B'av starts at sunset the day before
        const prevDay = new ComplexZmanimCalendar(location);
        const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        prevDate.setDate(prevDate.getDate() - 1);
        prevDay.setDate(prevDate);
        fastStart = prevDay.getSunset()?.toJSDate() || null;
      } else if (jewishCalendar.getYomTovIndex() === JewishCalendar.YOM_KIPPUR) {
         // Yom Kippur starts at candle lighting (handled above, but for fast start:)
         const prevDay = new ComplexZmanimCalendar(location);
         const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
         prevDate.setDate(prevDate.getDate() - 1);
         prevDay.setDate(prevDate);
         fastStart = prevDay.getCandleLighting()?.toJSDate() || null;
      } else {
        fastStart = calendar.getAlosBaalHatanya()?.toJSDate() || null;
      }
      // Fast ends at Tzais (8.5 degrees is standard for fast end too)
      fastEnd = calendar.getTzaisGeonim8Point5Degrees()?.toJSDate() || null;
    }

    const zmanim: Zman[] = [
      {
        name: "עלות השחר",
        time: calendar.getAlosBaalHatanya()?.toJSDate() || null,
        description: "72 דקות לפני הנץ"
      },
      {
        name: "זמן תפילין (משיכיר)",
        time: calendar.getAlos72()?.toJSDate() || null,
        description: "זמן הנחת תפילין (משוער)"
      },
      {
        name: "הנץ החמה",
        time: calendar.getSunrise()?.toJSDate() || null,
        description: "תחילת היום"
      },
      {
        name: "סוף זמן קריאת שמע (אדה\"ז)",
        time: calendar.getSofZmanShmaBaalHatanya()?.toJSDate() || null,
        description: "לפי שיטת אדמו\"ר הזקן"
      },
      {
        name: "סוף זמן קריאת שמע (מ\"א)",
        time: calendar.getSofZmanShmaMGA()?.toJSDate() || null,
        description: "לפי שיטת מגן אברהם"
      },
      {
        name: "סוף זמן קריאת שמע (גר\"א)",
        time: calendar.getSofZmanShmaGRA()?.toJSDate() || null,
        description: "לפי שיטת הגר\"א"
      },
      {
        name: "סוף זמן תפילה (אדה\"ז)",
        time: calendar.getSofZmanTfilaBaalHatanya()?.toJSDate() || null,
        description: "לפי שיטת אדמו\"ר הזקן"
      },
      {
        name: "חצות היום",
        time: calendar.getChatzos()?.toJSDate() || null,
        description: "אמצע היום"
      },
      {
        name: "מנחה גדולה",
        time: calendar.getMinchaGedolaBaalHatanya()?.toJSDate() || null,
        description: "חצי שעה זמנית אחרי חצות"
      },
      {
        name: "מנחה קטנה",
        time: calendar.getMinchaKetanaBaalHatanya()?.toJSDate() || null,
        description: "9.5 שעות זמניות"
      },
      {
        name: "פלג המנחה",
        time: calendar.getPlagHaminchaBaalHatanya()?.toJSDate() || null,
        description: "1.25 שעות זמניות לפני השקיעה"
      },
      {
        name: "שקיעה",
        time: calendar.getSunset()?.toJSDate() || null,
        description: "סוף היום"
      },
      {
        name: "צאת הכוכבים (אדה\"ז)",
        time: calendar.getTzaisBaalHatanya()?.toJSDate() || null,
        description: "שיטת אדמו\"ר הזקן"
      },
      {
        name: "חצות הלילה",
        time: calendar.getSolarMidnight()?.toJSDate() || null,
        description: "אמצע הלילה"
      }
    ];

    return {
      hebrewDate: hebrewDateStr,
      hebrewDay: Math.round(jewishCalendar.getJewishDayOfMonth()),
      hebrewMonth: Math.round(jewishCalendar.getJewishMonth()),
      hebrewYear: Math.round(jewishCalendar.getJewishYear()),
      zmanim,
      isNextDay,
      chassidicEvent: chassidicEvent || undefined,
      parsha,
      specialDay,
      candleLighting,
      havdalah,
      fastStart,
      fastEnd
    };
  } catch (e) {
    console.error("Critical error in calculateZmanim:", e);
    return {
      hebrewDate: "שגיאה בחישוב",
      hebrewDay: 1,
      hebrewMonth: 1,
      hebrewYear: 5784,
      zmanim: [],
      isNextDay: false
    };
  }
}
