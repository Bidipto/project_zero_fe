import React from "react";
import { motion } from "framer-motion";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => {
	return (
		<div className="relative">
			<motion.input
				whileFocus={{ scale: 1.02 }}
				className="block w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
				{...(props as any)}
			/>
		</div>
	);
}; 