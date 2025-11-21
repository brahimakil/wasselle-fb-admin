# Weight Brackets - Delivery Pricing Guide

## Overview
The Weight Brackets system allows you to dynamically manage delivery pricing based on package weight. Changes made in the admin panel take effect immediately for all new delivery requests.

## How It Works

### Formula
```
Price (Points) = Base Price + (Weight × Price Per Kg)
```
- **Base Price**: Starting cost for the weight range
- **Price Per Kg**: Additional cost multiplied by the package weight
- **Final Price**: Always rounded UP to the nearest whole number (no decimals)

### Example Setup

| Weight Range | Base Price | Price Per Kg | Example Calculations |
|--------------|------------|--------------|---------------------|
| 0 - 5 kg     | 3 points   | 0.5 points   | 2kg = 4 points, 5kg = 6 points |
| 5 - 10 kg    | 5 points   | 0.7 points   | 7kg = 10 points, 10kg = 12 points |
| 10 - 20 kg   | 8 points   | 1.0 points   | 15kg = 23 points, 20kg = 28 points |
| 20 - 50 kg   | 15 points  | 1.5 points   | 30kg = 60 points, 50kg = 90 points |

## Managing Weight Brackets

### Creating a New Bracket
1. Click **"Add Bracket"** button
2. Set **Min Weight** and **Max Weight** (in kg)
3. Set **Base Price** (starting cost in points)
4. Set **Price Per Kg** (additional cost per kg)
5. Check **"Active"** to enable immediately
6. Click **"Create"**

### Editing a Bracket
1. Click the **Edit** icon (✏️) on any bracket
2. Update the values as needed
3. Click **"Update"**

### Deleting a Bracket
1. Click the **Delete** icon (🗑️) on any bracket
2. Confirm deletion

### Activating/Deactivating
- Uncheck **"Active"** to temporarily disable a bracket without deleting it
- Only **active** brackets are available for price calculation

## Important Notes

### Weight Ranges
- **No Gaps**: Ensure weight ranges cover all possible weights
- **No Overlaps**: Ranges should not overlap (e.g., 0-5, 5-10, 10-20)
- Users will see an error if their package weight doesn't fit any bracket

### Pricing Strategy
- Points = Dollars (1 point = $1 USD)
- Keep prices as whole numbers when possible
- Decimals are automatically rounded UP
  - Example: 4.1 points → 5 points
  - Example: 7.9 points → 8 points

### Mobile App Behavior
- **Taxi Service**: Users manually enter price
- **Delivery Service**: 
  - Users enter package weight
  - Price is automatically calculated
  - Price field is read-only (auto-filled)

## Best Practices

1. **Start Simple**: Begin with 3-4 brackets covering common weights
2. **Test Pricing**: Use the example calculations shown on each bracket
3. **Monitor Usage**: Check which weight ranges are most common
4. **Adjust Gradually**: Small price changes are better than large jumps
5. **Competitive Pricing**: Research local delivery rates
6. **Clear Ranges**: Use logical weight breaks (5, 10, 20, 50 kg)

## Example Scenarios

### Light Packages (Documents)
- **Range**: 0 - 2 kg
- **Base**: 2 points
- **Per Kg**: 0.5 points
- **Result**: Most documents = 2-3 points

### Medium Packages (Parcels)
- **Range**: 2 - 10 kg
- **Base**: 4 points
- **Per Kg**: 0.8 points
- **Result**: Typical parcel = 6-12 points

### Heavy Packages (Large Items)
- **Range**: 10 - 30 kg
- **Base**: 10 points
- **Per Kg**: 1.2 points
- **Result**: Furniture/appliances = 20-46 points

## Troubleshooting

### Users Can't Request Delivery
- **Cause**: No active weight brackets
- **Solution**: Ensure at least one bracket is marked as "Active"

### Price Seems Wrong
- **Check**: Verify formula calculation in bracket examples
- **Fix**: Adjust Base Price or Price Per Kg values

### Weight Range Gaps
- **Symptom**: Error when user enters certain weights
- **Fix**: Create brackets to cover all weights (e.g., add 0-5, 5-10, 10-20, 20-50)

## Updates & Changes
- Changes take effect **immediately**
- No app restart required
- Existing active requests keep their original price
- New requests use updated brackets

---

**Note**: Always test pricing changes with small adjustments first. You can preview calculations directly in the admin panel before making changes live.
