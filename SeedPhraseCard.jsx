import { motion, AnimatePresence } from "framer-motion";
import { Onboarding } from "./UI";
import CreateWallet from "./CreateWallet";
import SeedPhraseCard from "./SeedPhraseCard";
import RestoreWallet from "./RestoreWallet";
import { useState,useEffect } from "react";
const variants = {
  initial: (dir) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.05, ease: "easeIn" },
  },
  exit: (dir) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.005 },
  }),
};

export default function OnboardingFlow({
  step,
  setStep,
  setSeedPhrase,
  onFinish
}) {
  const direction = step === "start" ? -1 : 1;
  const [userPin, setUserPin] = useState("");
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0c0a09] to-purple-950 flex items-center justify-center">
      <div className="w-[380px] p-8 rounded-2xl bg-white/10 border border-white/10 text-center shadow-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          {/* START */}
          {step === "start" && (
            <motion.div
              key="start"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Onboarding
                onCreate={() => setStep("create")}
                onRestore={(type) => {
                  if (type === "seed") setStep("restore");
                  if (type === "email") setStep("created");
                }}
              />
            </motion.div>
          )}

        
          {step === "restore" && (
            <motion.div
              key="restore"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <RestoreWallet
                onRestore={() => {
                  onFinish();
                }}
              />
            </motion.div>
          )}

        
          {step === "create" && (
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CreateWallet onDone={() => setStep("seed")} step={step} setparentpin={setUserPin} />
            </motion.div>
          )}
          
            {step === "created" && (
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CreateWallet onDone={ onFinish} step={step} setparentpin={setUserPin}/>
            </motion.div>
          )}
        
          {step === "seed" && (
            <motion.div
              key="seed"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SeedPhraseCard 
                onConfirm={onFinish}
                encryptionPin={userPin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
