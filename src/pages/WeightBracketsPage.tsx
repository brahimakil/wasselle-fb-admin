import React, { useState, useEffect } from 'react';
import { PlusIcon, Pencil1Icon, TrashIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { WeightBracket, WeightBracketFormData } from '../types/weightBracket';
import {
  getWeightBrackets,
  createWeightBracket,
  updateWeightBracket,
  deleteWeightBracket,
} from '../services/weightBracketService';

export const WeightBracketsPage: React.FC = () => {
  const [brackets, setBrackets] = useState<WeightBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBracket, setEditingBracket] = useState<WeightBracket | null>(null);
  const [formData, setFormData] = useState<WeightBracketFormData>({
    minWeight: 0,
    maxWeight: 5,
    basePrice: 3,
    pricePerKg: 0.5,
    isActive: true,
  });

  useEffect(() => {
    loadBrackets();
  }, []);

  const loadBrackets = async () => {
    try {
      setLoading(true);
      const data = await getWeightBrackets();
      setBrackets(data);
    } catch (error) {
      console.error('Error loading weight brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate min < max
    if (formData.minWeight >= formData.maxWeight) {
      alert('Min weight must be less than max weight');
      return;
    }

    // Check for overlapping brackets
    const hasOverlap = brackets.some((bracket) => {
      // Skip the bracket we're editing
      if (editingBracket && bracket.id === editingBracket.id) {
        return false;
      }

      // Check if ranges overlap
      // Overlap occurs if: newMin < existingMax AND newMax > existingMin
      const overlaps = 
        formData.minWeight < bracket.maxWeight && 
        formData.maxWeight > bracket.minWeight;

      return overlaps;
    });

    if (hasOverlap) {
      alert(
        `Weight range ${formData.minWeight}-${formData.maxWeight}kg overlaps with an existing bracket.\n\n` +
        'Please choose a different range that does not overlap with existing brackets.'
      );
      return;
    }

    try {
      if (editingBracket) {
        await updateWeightBracket(editingBracket.id, formData);
      } else {
        await createWeightBracket(formData);
      }
      setShowModal(false);
      setEditingBracket(null);
      resetForm();
      loadBrackets();
    } catch (error) {
      console.error('Error saving weight bracket:', error);
      alert('Failed to save weight bracket');
    }
  };

  const handleEdit = (bracket: WeightBracket) => {
    setEditingBracket(bracket);
    setFormData({
      minWeight: bracket.minWeight,
      maxWeight: bracket.maxWeight,
      basePrice: bracket.basePrice,
      pricePerKg: bracket.pricePerKg,
      isActive: bracket.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight bracket?')) return;
    try {
      await deleteWeightBracket(id);
      loadBrackets();
    } catch (error) {
      console.error('Error deleting weight bracket:', error);
      alert('Failed to delete weight bracket');
    }
  };

  const resetForm = () => {
    setFormData({
      minWeight: 0,
      maxWeight: 5,
      basePrice: 3,
      pricePerKg: 0.5,
      isActive: true,
    });
  };

  const calculateExamplePrice = (weight: number, bracket: WeightBracket) => {
    const price = bracket.basePrice + (weight * bracket.pricePerKg);
    return Math.ceil(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading weight brackets...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Delivery Weight Brackets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage delivery pricing based on package weight</p>
        </div>
        <button
          onClick={() => {
            setEditingBracket(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          Add Bracket
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Use Weight Brackets</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Create weight ranges (e.g., 0-5 kg, 5-10 kg, 10-20 kg)</li>
              <li>Set a <strong>base price</strong> (starting cost) for each bracket</li>
              <li>Set <strong>price per kg</strong> (additional cost per kilogram)</li>
              <li>Formula: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Price = Base Price + (Weight × Price Per Kg)</code></li>
              <li>Prices are automatically rounded up to whole numbers (no decimals)</li>
              <li>Changes take effect immediately for all new delivery requests</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Brackets List */}
      <div className="grid gap-4">
        {brackets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No weight brackets yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Click "Add Bracket" to create your first one</p>
          </div>
        ) : (
          brackets.map((bracket) => (
            <div
              key={bracket.id}
              className={`border rounded-lg p-4 ${
                bracket.isActive ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {bracket.minWeight} - {bracket.maxWeight} kg
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        bracket.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {bracket.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Base Price</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{bracket.basePrice} points</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Price Per Kg</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{bracket.pricePerKg} points</p>
                    </div>
                  </div>

                  {/* Example Calculations */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Examples:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Min ({bracket.minWeight}kg):</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {calculateExamplePrice(bracket.minWeight, bracket)} pts
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Mid:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {calculateExamplePrice((bracket.minWeight + bracket.maxWeight) / 2, bracket)} pts
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Max ({bracket.maxWeight}kg):</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {calculateExamplePrice(bracket.maxWeight, bracket)} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(bracket)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Edit"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bracket.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingBracket ? 'Edit Weight Bracket' : 'Add Weight Bracket'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, minWeight: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.maxWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, maxWeight: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Price (points)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Kg
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pricePerKg}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBracket(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBracket ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
