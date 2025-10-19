<?php

class Expense {

  private $table;
  private $wpdb;

  public function __construct() {
    global $wpdb;
    $this->wpdb = $wpdb;
    $this->table = $wpdb->prefix . 'expenses';
  }

  public function get_all_expenses() {
    $query = "SELECT * FROM {$this->table} ORDER BY date DESC, id DESC";
    return $this->wpdb->get_results($query, ARRAY_A); // return as array of associative arrays
  }

  public function add_expense($user_id, $date, $amount, $description) {
    return $this->wpdb->insert(
        $this->table,
        [
        'user_id'    => $user_id,
        'date'       => $date,
        'amount'     => $amount,
        'description'=> $description
        ],
        [
        '%d', '%s', '%d', '%s'
        ]
    );
    }

    public function delete_expense($id) {
        return $this->wpdb->delete(
            $this->table,
            ['id' => $id],
            ['%d']
        );
        }

        public function update_expense($id, $date, $amount, $description) {
            return $this->wpdb->update(
                $this->table,
                [
                'date'        => $date,
                'amount'      => $amount,
                'description' => $description
                ],
                ['id' => $id],
                ['%s', '%d', '%s'],
                ['%d']
            );
            }



}
