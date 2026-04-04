"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Car,
  RefreshCw,
  Backpack,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { setStorageItem, STORAGE_KEYS } from "@/lib/storage";

// --- Types ---

interface OnboardingData {
  licenseType: string;
  ageGroup: string;
  completedAt: string;
}

interface SelectionCard {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// --- Step data ---

const LICENSE_OPTIONS: SelectionCard[] = [
  {
    id: "original",
    label: "Learner Permit",
    description: "Getting my first Utah license",
    icon: <FileText size={32} className="text-amber-500" />,
  },
  {
    id: "transfer",
    label: "Transfer",
    description: "Moving to Utah from another state",
    icon: <Car size={32} className="text-amber-500" />,
  },
  {
    id: "renewal",
    label: "Renewal",
    description: "Renewing my expired Utah license",
    icon: <RefreshCw size={32} className="text-amber-500" />,
  },
];

const AGE_OPTIONS: SelectionCard[] = [
  {
    id: "teen",
    label: "Teen (15-17)",
    description: "Getting my first license",
    icon: <Backpack size={32} className="text-amber-500" />,
  },
  {
    id: "adult",
    label: "Adult (18+)",
    description: "New driver or new to Utah",
    icon: <User size={32} className="text-amber-500" />,
  },
];

// --- Animation variants ---

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

// --- Component ---

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [licenseType, setLicenseType] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");

  const totalSteps = 3;
  const progressValue = ((step + 1) / totalSteps) * 100;

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function handleLicenseSelect(id: string) {
    setLicenseType(id);
    // Auto-advance after a brief pause for visual feedback
    setTimeout(() => {
      setDirection(1);
      setStep(1);
    }, 200);
  }

  function handleAgeSelect(id: string) {
    setAgeGroup(id);
    setTimeout(() => {
      setDirection(1);
      setStep(2);
    }, 200);
  }

  function handleComplete() {
    const data: OnboardingData = {
      licenseType,
      ageGroup,
      completedAt: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.onboarding, data);
    router.push("/dashboard");
  }

  function getLicenseLabel(id: string): string {
    return LICENSE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }

  function getAgeLabel(id: string): string {
    return AGE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }

  return (
    <div>
      {/* Progress bar */}
      <ProgressBar
        value={progressValue}
        max={100}
        size="sm"
        color="amber"
        className="mb-8"
      />

      <AnimatePresence mode="wait" custom={direction}>
        {step === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              What are you preparing for?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              We&apos;ll customize your study plan
            </p>

            <div className="space-y-3">
              {LICENSE_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hover
                  onClick={() => handleLicenseSelect(option.id)}
                  className={
                    licenseType === option.id
                      ? "ring-2 ring-amber-500 border-amber-400"
                      : ""
                  }
                >
                  <CardBody className="flex items-center gap-4">
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Tell us about yourself
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This helps us pick the right content for you
            </p>

            <div className="space-y-3">
              {AGE_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hover
                  onClick={() => handleAgeSelect(option.id)}
                  className={
                    ageGroup === option.id
                      ? "ring-2 ring-amber-500 border-amber-400"
                      : ""
                  }
                >
                  <CardBody className="flex items-center gap-4">
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle
                  size={56}
                  className="mx-auto text-green-500 mb-3"
                />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Here&apos;s your personalized study plan
              </p>
            </div>

            {/* Summary */}
            <Card className="mb-4">
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">License type</span>
                    <span className="font-semibold text-gray-900">
                      {getLicenseLabel(licenseType)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age group</span>
                    <span className="font-semibold text-gray-900">
                      {getAgeLabel(ageGroup)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* What the app covers */}
            <Card className="mb-6">
              <CardBody>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  What you&apos;ll study:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      <FileText size={16} />
                    </span>
                    <span>
                      <strong>Written Knowledge Test</strong> &mdash; 50
                      questions, 80% to pass
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">
                      <CheckCircle size={16} />
                    </span>
                    <span>
                      <strong>Traffic Safety Exam</strong> &mdash; 40 questions,
                      100% required
                    </span>
                  </li>
                </ul>
              </CardBody>
            </Card>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleComplete}
            >
              Start Learning
              <ArrowRight size={20} className="ml-2" />
            </Button>

            <div className="mt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
