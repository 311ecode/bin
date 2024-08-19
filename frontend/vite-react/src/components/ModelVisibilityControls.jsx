import React from 'react';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';

const ModelVisibilityControls = ({ visibleModels, onModelToggle }) => {
  return (
    <FormGroup row sx={{ flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
      {Object.keys(visibleModels).map(model => (
        <FormControlLabel
          key={model}
          control={
            <Checkbox
              checked={visibleModels[model]}
              onChange={() => onModelToggle(model)}
              name={model}
            />
          }
          label={model}
        />
      ))}
    </FormGroup>
  );
};

export default ModelVisibilityControls;
