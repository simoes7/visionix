import pool from '../config/db.js';

// Frame Styles
export const getFrameStyles = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM frame_styles ORDER BY name ASC');
    res.json(rows);
  } catch (err) { next(err); }
};

export const createFrameStyle = async (req, res, next) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO frame_styles (name) VALUES (?)', [name]);
    const [[row]] = await pool.query('SELECT * FROM frame_styles WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { next(err); }
};

export const updateFrameStyle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await pool.query('UPDATE frame_styles SET name = ? WHERE id = ?', [name, id]);
    const [[row]] = await pool.query('SELECT * FROM frame_styles WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
};

export const deleteFrameStyle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM frame_styles WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// Materials
export const getMaterials = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materials ORDER BY name ASC');
    res.json(rows);
  } catch (err) { next(err); }
};

export const createMaterial = async (req, res, next) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO materials (name) VALUES (?)', [name]);
    const [[row]] = await pool.query('SELECT * FROM materials WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { next(err); }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await pool.query('UPDATE materials SET name = ? WHERE id = ?', [name, id]);
    const [[row]] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

export default {
  getFrameStyles, createFrameStyle, updateFrameStyle, deleteFrameStyle,
  getMaterials, createMaterial, updateMaterial, deleteMaterial
};
