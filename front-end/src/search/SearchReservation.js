import { useState } from "react";
import { listReservations, updateReservationStatus } from "../utils/api";

function SearchReservation() {
  const [searchValue, setSearchValue] = useState("");
  const [foundReservations, setFoundReservations] = useState([]);

  function searchHandler() {
    listReservations({ mobile_number: searchValue }).then(setFoundReservations);
  }

  async function cancelHandler(reservation) {
    // confirmation alert
    // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-ok-and-cancel-options
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      updateReservationStatus(reservation.reservation_id, "cancelled").then(
        searchHandler
      );
    } else {
      // do nothing with cancel, it automatically closes alert
    }
  }

  const reservationsTable = foundReservations.map((reservation) => (
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
      </td>
    </tr>
  ));

  return (
    <div className="p-3">
      <div className="d-md-flex mb-3">
        <input
          name="mobile_number"
          placeholder="Enter a customer's phone number"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <div className="d-md-flex pl-3">
          <button
            className="btn btn-primary"
            onClick={searchHandler}
            type="submit"
          >
            Find
          </button>
        </div>
      </div>

      <div className="d-md-flex mb-3">
        {foundReservations.length ? (
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
        ) : (
          <h3>No reservations found</h3>
        )}
      </div>
    </div>
  );
}

export default SearchReservation;
