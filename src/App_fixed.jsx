  useEffect(() => {
    // Check for existing game state when app loads
    const checkForExistingGame = async () => {
      if (!socket || socket.localMode || !socket.connected || !isInVoiceChannel) {
        console.log('Loading initial question for single player mode');
        pickAndSetRandomQuestion();
        return;
      }

      console.log('Multiplayer mode detected - checking for existing game...');
      
      try {
        // Check if there's already an active question in the room
        const result = await socket.emit('start_question', {
          roomId: roomId
        });
        
        console.log('Room check response:', result);
        
        if (result && (result.data?.question || result.question)) {
          const question = result.data?.question || result.question;
          const timeLeft = result.data?.timeLeft || result.timeLeft || MAX_TIME;
          
          console.log('Found existing question in room, joining game in progress');
          console.log('Time remaining:', timeLeft);
          
          setCurrentQuestion(question);
          setShowResult(false);
          setSelections({});
          setMySelection(null);
          currentSelectionRef.current = null;
          setTimeLeft(timeLeft);
          answerTimesRef.current = {};
          awardedDoneRef.current = false;
        } else {
          console.log('No active question found - player can start new quiz');
        }
      } catch (error) {
        console.log('Failed to check room state:', error);
      }
    };
    
    checkForExistingGame();
  }, [socket, isInVoiceChannel, roomId]);