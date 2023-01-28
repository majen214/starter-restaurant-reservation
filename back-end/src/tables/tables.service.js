const knex = require("../db/connection");

async function create(newTable) {
  return await knex("tables")
    .insert(newTable)
    .returning("*")
    .then((createdRecords) => createdRecords[0]);
}

function read(table_id) {
  return knex("tables").select("*").where({ table_id }).first();
}

async function list() {
  return knex("tables").select("*").orderBy("table_name");
}

//put request to update a table AKA to seat a table:
async function update(updatedTable) {
  return knex("tables")
    .select("*")
    .where({ table_id: updatedTable.table_id })
    .update(updatedTable, "*");
}

async function destroy(table) {
  return await knex("tables")
    .select("*")
    .where({ table_id: table.table_id })
    .update(table, "*");
}

module.exports = {
  create,
  list,
  update,
  read,
  destroy,
};
