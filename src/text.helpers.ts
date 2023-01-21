import moment from "moment";

export const getDateText = (inputDate: Date) => {
    const date = moment(inputDate).startOf('day');
    let diff = moment().startOf('day').diff(date, "days");
    switch (diff) {
        case -2: return "pojutrze"
        case -1: return "jutro"
        case 0: return "dziś"
        case 1: return "wczoraj"
        case 2: return "przedwczoraj"

        default: return weekDays[date.day()]
    }
}

export const weekDays = [
    'Nd',
    'Pn',
    'Wt',
    'Śr',
    'Czw',
    'Pt',
    'Sb'
]

export const getDaysText = (numberOfDays: number) => {
    if (numberOfDays === 1) { return "1 dzień"; } else { return numberOfDays + " dni" };
}