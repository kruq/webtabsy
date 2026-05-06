import OverdueDoseGroup from '../models/OverdueDosesGroup';
import IOverdueDoseGroup from './IOverdueDosesGroup';
import API_HOST from './api.constants';
import { getJson } from './http';
import { overdueDoseGroupFromDTO } from './mappers';

const API_URL = API_HOST + '/overdueDoses';

export async function findOverdueDoses(): Promise<OverdueDoseGroup[]> {
    const timezoneOffsetHours = (new Date()).getTimezoneOffset() / 60;
    const data = await getJson<IOverdueDoseGroup[]>(`${API_URL}/${timezoneOffsetHours}`);
    return data.map(overdueDoseGroupFromDTO);
}
