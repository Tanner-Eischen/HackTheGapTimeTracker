/**
 * ModalTest Component
 * 
 * A test component to demonstrate the enhanced modal feature emphasis functionality.
 * This component shows how to use the Modal component with feature emphasis.
 */
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

function ModalTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emphasizeFeature, setEmphasizeFeature] = useState(false);
  const [emphasizeSelector, setEmphasizeSelector] = useState('#dashboard-stats');
  const [emphasizePosition, setEmphasizePosition] = useState('auto');

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleEmphasis = () => {
    setEmphasizeFeature(!emphasizeFeature);
  };

  return (
    <div className="container mt-5">
      <h2>Modal Feature Emphasis Test</h2>
      <p>This component demonstrates the enhanced modal feature emphasis functionality.</p>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="emphasizeFeatureToggle"
              checked={emphasizeFeature}
              onChange={toggleEmphasis}
            />
            <label className="form-check-label" htmlFor="emphasizeFeatureToggle">
              Enable Feature Emphasis
            </label>
          </div>
          
          <div className="mb-3">
            <label htmlFor="emphasizeSelector" className="form-label">Element Selector to Emphasize</label>
            <input
              type="text"
              className="form-control"
              id="emphasizeSelector"
              value={emphasizeSelector}
              onChange={(e) => setEmphasizeSelector(e.target.value)}
            />
            <div className="form-text">CSS selector for the element to emphasize (e.g., #dashboard-stats)</div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="emphasizePosition" className="form-label">Modal Position</label>
            <select
              className="form-select"
              id="emphasizePosition"
              value={emphasizePosition}
              onChange={(e) => setEmphasizePosition(e.target.value)}
            >
              <option value="auto">Auto (Smart Positioning)</option>
              <option value="above">Above Element</option>
              <option value="below">Below Element</option>
              <option value="left">Left of Element</option>
              <option value="right">Right of Element</option>
            </select>
          </div>
          
          <Button variant="primary" onClick={openModal}>
            Open Test Modal
          </Button>
        </div>
        
        <div className="col-md-6">
          <div id="dashboard-stats" className="card p-4 bg-light">
            <h4>Sample Dashboard Stats</h4>
            <p>This is a sample element that can be emphasized by the modal.</p>
            <div className="row">
              <div className="col-6">
                <div className="border rounded p-2 bg-white">
                  <h5>Hours Worked</h5>
                  <p className="fs-4 mb-0">42.5</p>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded p-2 bg-white">
                  <h5>Projects</h5>
                  <p className="fs-4 mb-0">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Feature Emphasis Demo"
        emphasizeFeature={emphasizeFeature}
        emphasizeSelector={emphasizeSelector}
        emphasizePosition={emphasizePosition}
        emphasizeColor="rgba(13, 110, 253, 0.5)"
      >
        <div className="p-3">
          <p>This modal demonstrates the feature emphasis functionality.</p>
          <p>When feature emphasis is enabled, the modal will highlight the specified element and position itself to avoid obstructing the highlighted feature.</p>
          <p>Try changing the settings and reopening the modal to see different emphasis behaviors.</p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={closeModal}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}

export default ModalTest;