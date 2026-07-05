
- Clear log entries
  ```sql
  DELETE FROM mdl_hypervideo_log;
  ```
- List all entries from log
  ```sql
  SELECT
    id, 
    hypervideo, 
    userid, 
    course, 
    context, 
    position, 
    actions, 
    IF(CHAR_LENGTH(val) > 20, CONCAT(LEFT(val, 20), '...'), val) AS val, 
    duration, 
    FROM_UNIXTIME(timemodified)
  FROM mdl_hypervideo_log;
  ```
