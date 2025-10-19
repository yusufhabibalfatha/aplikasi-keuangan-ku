<?php

class Expenses_Controller {

  public function get_all() {
    $expense = new Expense();
    $data = $expense->get_all_expenses();

    return rest_ensure_response([
      'success' => true,
      'data' => $data
    ]);
  }

  public function add($request) {
    $params = $request->get_json_params();

    // Validasi sederhana
    $date = isset($params['date']) ? sanitize_text_field($params['date']) : null;
    $amount = isset($params['amount']) ? intval($params['amount']) : null;
    $description = isset($params['description']) ? sanitize_text_field($params['description']) : '';

    if (!$date || !$amount) {
        return new WP_Error('missing_fields', 'Tanggal dan jumlah harus diisi.', ['status' => 400]);
    }

    $user_id = get_current_user_id(); // bisa diganti static user_id = 1 untuk testing

    // Sementara pakai user_id 1 jika belum pakai login
    if (!$user_id) $user_id = 1;

    $expense = new Expense();
    $inserted = $expense->add_expense($user_id, $date, $amount, $description);

    if ($inserted) {
        return rest_ensure_response([
        'success' => true,
        'message' => 'Pengeluaran berhasil ditambahkan.'
        ]);
    } else {
        return new WP_Error('insert_failed', 'Gagal menambahkan data.', ['status' => 500]);
    }
}

public function delete($request) {
  $id = intval($request['id']);

  if (!$id) {
    return new WP_Error('invalid_id', 'ID tidak valid.', ['status' => 400]);
  }

  $expense = new Expense();
  $deleted = $expense->delete_expense($id);

  if ($deleted) {
    return rest_ensure_response([
      'success' => true,
      'message' => "Data dengan ID $id berhasil dihapus."
    ]);
  } else {
    return new WP_Error('delete_failed', "Gagal menghapus data dengan ID $id.", ['status' => 500]);
  }
}

public function update($request) {
  $id = intval($request['id']);
  $params = $request->get_json_params();

  $date        = isset($params['date']) ? sanitize_text_field($params['date']) : null;
  $amount      = isset($params['amount']) ? intval($params['amount']) : null;
  $description = isset($params['description']) ? sanitize_text_field($params['description']) : '';

  if (!$id || !$date || !$amount) {
    return new WP_Error('invalid_input', 'ID, tanggal, dan jumlah harus diisi.', ['status' => 400]);
  }

  $expense = new Expense();
  $updated = $expense->update_expense($id, $date, $amount, $description);

  if ($updated !== false) {
    return rest_ensure_response([
      'success' => true,
      'message' => "Data dengan ID $id berhasil diperbarui."
    ]);
  } else {
    return new WP_Error('update_failed', "Gagal memperbarui data dengan ID $id.", ['status' => 500]);
  }
}



}
