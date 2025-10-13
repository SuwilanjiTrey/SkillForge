// src/scripts/initializePrograms.js
// Run this script ONCE to populate the programs collection with initial data
// You can run this from a temporary component or directly in the browser console

import { db } from '../AnA/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const initializePrograms = async () => {
  try {
    // Check if programs already exist
    const programsRef = collection(db, 'programs');
    const snapshot = await getDocs(programsRef);
    
    if (snapshot.size > 0) {
      console.log('Programs collection already has data. Skipping initialization.');
      return;
    }

    // Initial programs to add
    const initialPrograms = [
      'Computer Science',
      'Natural Sciences',
      'Engineering',
      'Mathematics',
      'Medicine'
    ];

    // Add each program to Firestore
    const promises = initialPrograms.map(programName => 
      addDoc(collection(db, 'programs'), {
        name: programName,
        createdAt: new Date()
      })
    );

    await Promise.all(promises);
    
    console.log('✅ Successfully initialized programs collection with', initialPrograms.length, 'programs');
    console.log('Programs added:', initialPrograms.join(', '));
    
  } catch (error) {
    console.error('❌ Error initializing programs:', error);
  }
};

export default initializePrograms;

// HOW TO USE THIS SCRIPT:
// Option 1: Create a temporary component and call this function in useEffect
// Option 2: Import and call this in your App.js once
// Option 3: Run directly in browser console by copying the function

/*
EXAMPLE USAGE IN A COMPONENT:

import React, { useEffect } from 'react';
import initializePrograms from './scripts/initializePrograms';

function InitPrograms() {
  useEffect(() => {
    initializePrograms();
  }, []);

  return <div>Initializing programs...</div>;
}

Then render this component once, then remove it.
*/
