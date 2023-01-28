const reservationsService = require("./reservations.service.js");
const hasProperties = require("../errors/hasProperties");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

//validations below

function resExists(req, res, next) {
  reservationsService
    .read(req.params.reservation_id)
    .then((reservation) => {
      if (reservation) {
        res.locals.reservation = reservation;
        return next();
      }
      next({
        status: 404,
        message: `Reservation ${req.params.reservation_id} cannot be found.`,
      });
    })
    .catch(next);
}

const hasRequiredProperties = hasProperties(
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people"
);

const VALID_PROPERTIES = [
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
  "status",
  "status",
  "reservation_id",
  "created_at",
  "updated_at",
];

function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}

function validDate(req, res, next) {
  const date = new Date(req.body.data.reservation_date.replace("-", "/"));
  // testing if date is a date
  if (!(date instanceof Date) || isNaN(date)) {
    return next({
      status: 400,
      message: `Invalid field(s): reservation_date`,
    });
  }
  // date is not in the past
  const today = new Date();
  // need to pass the "toDateString()" to a new date object to remove the time
  if (new Date(date.toDateString()) < new Date(today.toDateString())) {
    return next({
      status: 400,
      message: `Invalid field(s): reservation_date must be in the future`,
    });
  }
  // date is not a tuesday
  if (date.getDay() == 2) {
    return next({
      status: 400,
      message: `Invalid field(s): change reservation_date. restaurant is closed on tuesdays. `,
    });
  }
  return next();
}

function validTime(req, res, next) {
  const isValid = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(
    req.body.data.reservation_time
  );
  if (isValid) {
    return next();
  }
  return next({
    status: 400,
    message: `Invalid field(s): reservation_time`,
  });
}
// reservation time must be between 1030 and 2130
function correctTime(req, res, next) {
  let time = req.body.data.reservation_time;
  time = time.replace(":", "");
  if (time < 1030) {
    return next({
      status: 400,
      message: `The restaurant opens at 10:30 AM`,
    });
  } else if (time > 2130) {
    return next({
      status: 400,
      message: `We do not accept reservations after 9:30 PM`,
    });
  }
  const currentTime = new Date();
  const dataTime = new Date(
    `${req.body.data.reservation_date.replace("-", "/")} ${
      req.body.data.reservation_time
    }`
  );
  if (dataTime.getTime() < currentTime.getTime()) {
    return next({
      status: 400,
      message: `Reservation must be in the future`,
    });
  }
  return next();
}

function hasPeople(req, res, next) {
  const people = Number(req.body.data.people);
  if (people >= 1) {
    return next();
  } else {
    return next({ status: 400, message: `Invalid field(s): people` });
  }
}

function peopleNumber(req, res, next) {
  // checks the type of the data coming through, because a string version of a number should fail (ie, "2" should fail)
  if (typeof req.body.data.people !== "number") {
    return next({
      status: 400,
      message: `Invalid field(s): people amount must be a number.`,
    });
  }
  return next();
}

function statusBooked(req, res, next) {
  // checks the type of the data coming through, because a string version of a number should fail (ie, "2" should fail)
  if (req.body.data.status && req.body.data.status !== "booked") {
    return next({
      status: 400,
      message: `Invalid field(s): status cannot be ${req.body.data.status}.`,
    });
  }
  return next();
}

function correctStatus(req, res, next) {
  if (
    req.body.data.status &&
    req.body.data.status !== "booked" &&
    req.body.data.status !== "finished" &&
    req.body.data.status !== "seated" &&
    req.body.data.status !== "cancelled"
  ) {
    return next({
      status: 400,
      message: `Invalid field(s): status cannot be ${req.body.data.status}.`,
    });
  }
  return next();
}

function statusNotFinished(req, res, next) {
  if (res.locals.reservation.status === "finished") {
    return next({
      status: 400,
      message: `Invalid field(s): ${res.locals.reservation.status} reservation cannot be updated.`,
    });
  }
  return next();
}

//validations above

async function create(req, res) {
  const newReservation = await reservationsService.create({
    ...req.body.data,
    status: "booked",
  });
  res.status(201).json({
    data: newReservation,
  });
}

async function list(req, res) {
  const data = await reservationsService.list(req.query);
  res.json({
    data: data.filter((reservation) => reservation.status !== "finished"),
  });
}
async function read(req, res) {
  res.json({
    data: res.locals.reservation,
  });
}

async function update(req, res) {
  const updatedRes = {
    ...res.locals.reservation,
    ...req.body.data,
  };
  const reservation = await reservationsService.update(updatedRes);
  res.json({
    data: reservation[0],
  });
}

module.exports = {
  list: asyncErrorBoundary(list),
  read: [resExists, read],
  create: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    validDate,
    validTime,
    correctTime,
    hasPeople,
    peopleNumber,
    statusBooked,
    asyncErrorBoundary(create),
  ],
  updateStatus: [
    resExists,
    statusNotFinished,
    correctStatus,
    asyncErrorBoundary(update),
  ],
  update: [
    resExists,
    statusNotFinished,
    hasOnlyValidProperties,
    hasRequiredProperties,
    validDate,
    validTime,
    correctTime,
    hasPeople,
    peopleNumber,
    asyncErrorBoundary(update),
  ],
};
