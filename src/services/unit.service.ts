import Unit from '../models/Unit';
import API_HOST from './api.constants';
import { getJson, postJsonForResult } from './http';

const UNIT_URL = API_HOST + '/unit';

export async function fetchUnits(): Promise<Unit[]> {
    return getJson<Unit[]>(UNIT_URL);
}

export async function createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
    return postJsonForResult<Omit<Unit, 'id'>, Unit>(UNIT_URL, unit);
}
