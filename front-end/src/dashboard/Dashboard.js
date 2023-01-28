import React, { useEffect, useState } from "react";
import {
  finishTable,
  listReservations,
  updateReservationStatus,
} from "../utils/api";
import { listTables } from "../utils/api";
import { useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { today, next, previous } from "../utils/date-time";
import { useHistory } from "react-router-dom";

function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const params = useParams();
  const history = useHistory();

  useEffect(() => {
    // the today() method is what was previously being used
    // dashboard by default lists all reservations for today
    // if a date is passed in, lists all for that date
    const date = params.reservationDate || today();
    loadDashboard(date);
  }, [params]);

  function loadDashboard(date) {
    const abortController = new AbortController();
    setError(null);
    listReservations({ reservation_date: date }, abortController.signal)
      .then(setReservations)
      .catch(setError);
    listTables(abortController.signal).then(setTables).catch(setError);
    return () => abortController.abort();
  }

  //handlers for next, previous, and today buttons

  function nextHandler() {
    const currentDate = params.reservationDate || today();
    const nextDay = next(currentDate);
    history.push(`/dashboard/${nextDay}`);
  }

  function prevHandler() {
    const currentDate = params.reservationDate || today();
    const prevDay = previous(currentDate);
    history.push(`/dashboard/${prevDay}`);
  }

  function todayHandler() {
    const currentDate = today();
    history.push(`/dashboard/${currentDate}`);
  }

  async function finishHandler(table) {
    // confirmation alert
    // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-ok-and-cancel-options
    if (
      window.confirm(
        "Is this table ready to seat new guests? This cannot be undone."
      )
    ) {
      const date = params.reservationDate || today();
      finishTable(table).catch(setError);
      updateReservationStatus(table.reservation_id, "finished")
        .then(() => loadDashboard(date))
        .catch(setError);
    } else {
      // do nothing with cancel, it automatically closes alert
    }
  }

  async function cancelHandler(reservation) {
    const abortController = new AbortController();
    // confirmation alert
    // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-ok-and-cancel-options
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      const date = params.reservationDate || today();
      updateReservationStatus(
        reservation.reservation_id,
        "cancelled",
        abortController.signal
      )
        .then(() => loadDashboard(date))
        .catch(setError);
    } else {
      // do nothing with cancel, it automatically closes alert
    }
    return () => abortController.abort();
  }

  const reservationsTable = reservations
    .filter((reservation) => {
      return reservation.status !== "finished";
    })
    .map((reservation) => (
      <tr key={reservation.reservation_id}>
        <th scope="row">{reservation.reservation_id}</th>
        <td>{reservation.first_name}</td>
        <td>{reservation.last_name}</td>
        <td>{reservation.mobile_number}</td>
        <td>{reservation.reservation_date}</td>
        <td>{reservation.reservation_time}</td>
        <td>{reservation.people}</td>
        <td data-reservation-id-status={reservation.reservation_id}>
          {reservation.status}
        </td>
        <td>
          {reservation.status === "booked" && (
            <a
              href={`/reservations/${reservation.reservation_id}/edit`}
              className="btn btn-primary mr-2"
            >
              Edit
            </a>
          )}
          {reservation.status !== "cancelled" && (
            <button
              type="button"
              className="btn btn-primary mr-2 mt-2"
              onClick={() => cancelHandler(reservation)}
              data-reservation-id-cancel={reservation.reservation_id}
            >
              Cancel
            </button>
          )}
          {reservation.status === "booked" && (
            <a
              href={`/reservations/${reservation.reservation_id}/seat`}
              className="btn btn-primary mr-2 mt-2"
              data-table-id-seat={reservation.reservation_id}
            >
              Seat
            </a>
          )}
        </td>
      </tr>
    ));

  const tablesTable = tables.map((table) => {
    return (
      <tr key={table.table_id}>
        <th scope="row">{table.table_id}</th>
        <td>{table.table_name}</td>
        <td>{table.capacity}</td>
        <td data-table-id-status={table.table_id}>
          {table.reservation_id ? "Occupied" : "Free"}
        </td>
        {/* Only display this button on tables that have a reservation_id attached (meaning they have been seated) */}
        <td data-table-id-finish={table.table_id}>
          {table.reservation_id ? (
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={() => finishHandler(table)}
            >
              Finish
            </button>
          ) : (
            ""
          )}
        </td>
      </tr>
    );
  });

  return (
    <main>
      <h1>Dashboard</h1>
      <div className="d-md-flex mb-3">
        <h4 className="mb-0">{`Reservations for ${
          params.reservationDate || today()
        }`}</h4>
      </div>
      <div className="d-md-flex mb-3">
        <button
          type="button"
          className="btn btn-primary mr-2"
          onClick={prevHandler}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-primary mr-2"
          onClick={todayHandler}
        >
          Today
        </button>
        <button
          type="button"
          className="btn btn-primary mr-2"
          onClick={nextHandler}
        >
          Next
        </button>
      </div>
      <ErrorAlert error={error} />
      <div className="row">
        <div className="sm-col-8">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">First Name</th>
                <th scope="col">Last Name</th>
                <th scope="col">Mobile Number</th>
                <th scope="col">Reservation Date</th>
                <th scope="col">Reservation Time</th>
                <th scope="col">Number Of People</th>
                <th scope="col">Status</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>{reservationsTable}</tbody>
          </table>
        </div>
        <div className="sm-col-3" style={{ border: "1px solid grey" }}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Table Name</th>
                <th scope="col">Capacity</th>
                <th scope="col">Status</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>{tablesTable}</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
