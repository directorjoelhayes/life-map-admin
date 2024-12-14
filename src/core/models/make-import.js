import { v4 as uuid } from "uuid";

export function makeImport({
    _id,
    name = "Untilted Import",
    type = "import",
    status = 'PENDING',
    step = 1,
    createdAt = Date.now(),
    updatedAt = Date.now(),
    data = {}
} = {}) {
    if (!_id) {
        _id = `${uuid()}_${type}`;
    }
    if (!name) {
        throw new Error('Name is required');
    }
    if (!type) {
        throw new Error('Type is required');
    }
    if (!status) {
        throw new Error('Status is required');
    }
    if (!['PENDING', 'PARTIAL', 'COMPLETE'].includes(status)) {
        throw new Error('Status must be either PENDING, PARTIAL, or COMPLETE');
    }
    if (!createdAt) {
        throw new Error('Created date is required');
    }
    if (!updatedAt) {
        throw new Error('Updated date is required');
    }

    return {
        step,
        _id,
        name,
        type,
        status,
        createdAt,
        updatedAt,
        data
    }
}