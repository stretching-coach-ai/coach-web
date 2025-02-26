'use client';
import useEmblaCarousel from 'embla-carousel-react';
import { DotButton, useDotButton } from './embla-carousel-button';
import { cn } from '@/lib/utils';
import { UserInfoForm } from './user-info-form';
import { BodyPartSelector } from './body-part-selector';
import { Stardust } from '@/app/fonts';

const SLIDES = Array.from(Array(2).keys());

export const EmbalCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: false, // 자유로운 드래그 비활성화
    containScroll: 'keepSnaps',
  });

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  return (
    <section
      className={`${Stardust.className} mt-9 w-[390px] flex flex-col items-center m-auto embla`}
    >
      <div className="embla__controls">
        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <>
              <DotButton
                key={index}
                className={'embla__dot'.concat(
                  index === selectedIndex ? ' embla__dot--selected' : '',
                )}
              >
                {index + 1}
              </DotButton>
              {index === 0 && (
                <div className="h-[5px] bg-[#E5FFA9] w-[70px] overflow-hidden">
                  <div
                    className={cn(
                      'w-[-10px] h-[5px] bg-[#E5FFA9] border-[#E5FFA9] transform transition duration-500 delay-100 ease-in-out',
                      selectedIndex > index && 'w-[70px] bg-[#93D400] ',
                    )}
                  />
                </div>
              )}
            </>
          ))}
        </div>
      </div>
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {SLIDES.map((index) => (
            <div className="embla__slide" key={index}>
              {index === 0 && (
                <UserInfoForm onDotButtonClick={onDotButtonClick} />
              )}
              {index === 1 && <BodyPartSelector />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
