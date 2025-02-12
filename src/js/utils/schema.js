/**
 * @description Mappings for Sensource to Postgres schema
 */
class Schema {

  constructor() {

    this.schemas = [
      {
        name: 'occupancy',
        schema: 'occupancy',
        tables: [
          {
            name: 'location',
            table: 'location',
            fields: [
              {name: 'location_id', field: 'location_id', sensourceField: 'locationId'},
              {name: 'name', field: 'name', sensourceField: 'name'},
              {name: 'description', field: 'description', sensourceField: 'description'},
              {name: 'country', field: 'country', sensourceField: 'country'},
              {name: 'city', field: 'city', sensourceField: 'city'},
              {name: 'postal_code', field: 'postal_code', sensourceField: 'postalCode'},
              {name: 'state', field: 'state', sensourceField: 'state'},
              {name: 'street', field: 'street', sensourceField: 'street'},
              {name: 'timezone', field: 'timezone', sensourceField: 'timezone'},
              {name: 'src_created_at', field: 'src_created_at', sensourceField: 'createdAt'},
              {name: 'src_updated_at', field: 'src_updated_at', sensourceField: 'updatedAt'},
              {name: 'created_at', field: 'created_at'},
              {name: 'updated_at', field: 'updated_at'},
              {name: 'latitude', field: 'latitude', sensourceField: 'latitude'},
              {name: 'longitude', field: 'longitude', sensourceField: 'longitude'}
            ]
          },
          {
            name: 'occupancy',
            table: 'occupancy',
            fields: [
              {name: 'location_id', field: 'location_id', sensourceField: 'locationId'},
              {name: 'hour', field: 'hour', sensourceField: 'recordDate_hour_1'},
              {name: 'traffic_in', field: 'traffic_in', sensourceField: 'sumins'},
              {name: 'traffic_out', field: 'traffic_out', sensourceField: 'sumouts'},
              {name: 'occupancy_max', field: 'occupancy_max', sensourceField: 'maxoccupancy'},
              {name: 'occupancy_min', field: 'occupancy_min', sensourceField: 'minoccupancy'},
              {name: 'occupancy_avg', field: 'occupancy_avg', sensourceField: 'avgoccupancy'},
              {name: 'created_at', field: 'created_at'}
            ]
          }
        ]
      }
    ];
  }

  /**
   * @description Get schema description by name
   * @param {String} name - The name of the schema
   * @returns {Object} - The schema description
   */
  getSchema(name) {
    return this.schemas.find(schema => schema.name === name);
  }

  /**
   * @description Get table description by name
   * @param {String} schema - The name of the schema
   * @param {String} name - The name of the table
   * @returns {Object} - The table description
   */
  getTable(schema, name) {
    schema = this.getSchema(schema);
    if (!schema) return null;
    return schema.tables.find(table => table.name === name);
  }

  /**
   * @description Get field descriptions for a table
   * @param {String} schema - The name of the schema
   * @param {String} name - The name of the table
   * @returns {Array} - The field descriptions
   */
  getFields(schema, table) {
    table = this.getTable(schema, table);
    if (!table) return null;
    return table.fields;
  }

  /**
   * @description Convert names from Sensource API response to Postgres table field names
   * @param {String} schema - The name of the schema
   * @param {String} name - The name of the table
   * @param {Object} sensourceData - The data from Sensource
   * @returns {Object} - The data mapped to Postgres field names
   */
  sensourceToPg(schema, table, sensourceData) {
    const fields = this.getFields(schema, table);
    if (!fields) return null;

    const pgData = {};
    fields.forEach(field => {
      if ( !field.sensourceField ) return;
      pgData[field.field] = sensourceData[field.sensourceField];
    });

    return pgData;
  }

}

export default new Schema();
