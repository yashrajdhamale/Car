import React, { useState } from 'react';
import { Plane, X } from 'lucide-react'; // Import the X (close) icon from Lucide React

const Modal = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      {/* Icon button to open modal */}
      <button onClick={openModal} className="text-blue-500 p-2 focus:outline-none">
        <Plane />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-md">
            <h2 className="text-2xl mb-4">Modal Content</h2>
            <p>This is the content inside the modal.</p>
            {/* Icon button to close modal */}
            <button onClick={closeModal} className="mt-4 text-blue-500 p-2 focus:outline-none">
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modal;
