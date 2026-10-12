import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  assignServices,
  setStaffAvailability,
} from "../services/staff.service.js";

export async function listStaff(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const staff = await getAllStaff(includeInactive);

    return res.status(200).json({
      success: true,
      count: staff.length,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStaff(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await getStaffById(id);

    return res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const staff = await createStaff(req.body);
    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const staff = await updateStaff(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Staff profile updated successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

export async function assignServicesToStaff(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { serviceIds } = req.body;
    const staff = await assignServices(id, serviceIds);
    return res.status(200).json({
      success: true,
      message: "Services assigned successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { schedules } = req.body;
    const staff = await setStaffAvailability(id, schedules);
    return res.status(200).json({
      success: true,
      message: "Staff availability updated successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}
