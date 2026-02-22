import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, panelStyle }) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog className="relative z-50" onClose={onClose}>
        
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-[#102E50]/60 transition-opacity duration-100 ease-out"
        />

        <div className="fixed inset-0 flex items-center justify-center p-2">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={`${panelStyle} max-h-[90vh] overflow-y-auto scrollbar-hide`}
            >
              <DialogTitle className="lg:text-xl font-bold ml-5 text-white">
                {title}
              </DialogTitle>

              <div className="mt-2">
                {children}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
